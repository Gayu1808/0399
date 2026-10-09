import os, re, shutil, tempfile
from pathlib import Path
from datetime import date, timedelta
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import SQLModel, Session, select
from .db import engine, get_db
from .models import Document, Finding, Action, User, AuditLog
from .auth import (require, current_user, can, hash_pw, verify_pw, make_token, audit, seed_users,
                   visible_docs, visible_findings, auto_classify, LEVELS, CLEARANCE, PERMS)
from .pipeline.parse import parse_file
from .pipeline.extract import extract_fields
from .pipeline.detect import compare, base_and_version
from .seed import seed_demo
from .service import reanalyze, health

app = FastAPI(title="InfoMind AI")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        seed_users(s)
        if os.getenv("INFOMIND_SEED_DEMO", "0") == "1":
            seed_demo(s)

# ------------------------------------------------------------------ auth
@app.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), s: Session = Depends(get_db)):
    u = s.exec(select(User).where(User.username == form.username)).first()
    if not u or not u.active or not verify_pw(form.password, u.password_hash):
        audit(s, form.username, "login_failed")
        raise HTTPException(401, "Incorrect username or password")
    audit(s, u, "login")
    return {"access_token": make_token(u), "token_type": "bearer"}

@app.get("/auth/me")
def me(u: User = Depends(current_user)):
    return {"username": u.username, "name": u.full_name, "role": u.role,
            "clearance": CLEARANCE[u.role], "permissions": sorted(PERMS[u.role])}   # UI uses this to show/hide buttons

# ------------------------------------------------------------------ users (admin)
@app.get("/users")
def users(_: User = Depends(require("user:manage")), s: Session = Depends(get_db)):
    return [{"id": x.id, "username": x.username, "name": x.full_name, "role": x.role, "active": x.active}
            for x in s.exec(select(User)).all()]

@app.post("/users")
def add_user(username: str, password: str, role: str, name: str = "",
             a: User = Depends(require("user:manage")), s: Session = Depends(get_db)):
    if role not in PERMS: raise HTTPException(422, "Unknown role")
    if len(password) < 8: raise HTTPException(422, "Password must be at least 8 characters")
    if s.exec(select(User).where(User.username == username)).first(): raise HTTPException(409, "Username taken")
    u = User(username=username, full_name=name, role=role, password_hash=hash_pw(password))
    s.add(u); s.commit(); audit(s, a, "user_created", f"{username}:{role}")
    return {"id": u.id, "username": username, "role": role}

@app.patch("/users/{uid}")
def edit_user(uid: int, role: str | None = None, active: bool | None = None,
              a: User = Depends(require("user:manage")), s: Session = Depends(get_db)):
    u = s.get(User, uid)
    if not u: raise HTTPException(404)
    if u.id == a.id: raise HTTPException(400, "You cannot change your own role or status")
    if role:
        if role not in PERMS: raise HTTPException(422, "Unknown role")
        u.role = role
    if active is not None: u.active = active
    s.add(u); s.commit(); audit(s, a, "user_updated", f"{u.username}: role={u.role} active={u.active}")
    return {"username": u.username, "role": u.role, "active": u.active}

@app.get("/audit")
def audit_log(limit: int = 100, _: User = Depends(require("audit:read")), s: Session = Depends(get_db)):
    return s.exec(select(AuditLog).order_by(AuditLog.id.desc()).limit(limit)).all()

# ------------------------------------------------------------------ documents
@app.post("/documents")
async def upload(file: UploadFile = File(...), classification: str | None = Form(None),
                 u: User = Depends(require("doc:upload")), s: Session = Depends(get_db)):
    cls = classification or auto_classify(file.filename)
    if cls not in LEVELS: raise HTTPException(422, "classification must be internal, confidential or restricted")
    if LEVELS[cls] > CLEARANCE[u.role]:
        raise HTTPException(403, f"Your role cannot upload {cls} documents")
    with tempfile.TemporaryDirectory() as t:
        p = Path(t) / file.filename
        with p.open("wb") as out: shutil.copyfileobj(file.file, out)
        try: ext = extract_fields(parse_file(str(p)))
        except Exception as e: raise HTTPException(422, f"Unable to analyze this document: {e}")
    doc = Document(name=file.filename, doc_type=Path(file.filename).suffix.strip("."), classification=cls,
                   uploaded_by=u.username, entity=ext["entity"], fields=ext["fields"])
    s.add(doc); s.commit(); s.refresh(doc)
    reanalyze(s)
    audit(s, u, "document_uploaded", f"{doc.name} [{cls}]")
    new = [f for f in visible_findings(s, u) if doc.name in f.docs]
    return {"document": doc, "findings_for_document": new,
            "summary": {"findings": len(new), "conflicts": sum(f.kind == "conflict" for f in new),
                        "deadlines": sum(f.kind == "deadline" for f in new)}}

@app.get("/documents")
def documents(u: User = Depends(require("doc:read")), s: Session = Depends(get_db)):
    return visible_docs(s, u)

@app.delete("/documents/{did}")
def delete_doc(did: int, u: User = Depends(require("doc:delete")), s: Session = Depends(get_db)):
    d = s.get(Document, did)
    if not d: raise HTTPException(404)
    s.delete(d); s.commit(); reanalyze(s); audit(s, u, "document_deleted", d.name)
    return {"deleted": d.name}

# ------------------------------------------------------------------ findings
@app.get("/findings")
def findings(status: str = "open", kind: str | None = None,
             u: User = Depends(require("finding:read")), s: Session = Depends(get_db)):
    fs = [f for f in visible_findings(s, u, status) if not kind or f.kind == kind]
    return sorted(fs, key=lambda f: -f.score)

def _visible_finding(s, u, fid) -> Finding:
    f = next((x for x in visible_findings(s, u, None) if x.id == fid), None)
    if not f: raise HTTPException(404, "Finding not found")       # 404, not 403: don't reveal it exists
    return f

@app.post("/findings/{fid}/action")                             # declared before the {verb} route
def create_action(fid: int, u: User = Depends(require("action:create")), s: Session = Depends(get_db)):
    f = _visible_finding(s, u, fid)
    a = Action(finding_id=fid, title=f.next.rstrip("."), priority=f.severity, created_by=u.username,
               assignee=u.username, due=date.today() + timedelta(days=1 if f.severity == "CRITICAL" else 5))
    s.add(a); s.commit(); s.refresh(a); audit(s, u, "action_created", f.title)
    return a

@app.post("/findings/{fid}/resolve")
def resolve(fid: int, u: User = Depends(require("finding:resolve")), s: Session = Depends(get_db)):
    return _set_status(s, u, fid, "resolved")

@app.post("/findings/{fid}/dismiss")
def dismiss(fid: int, u: User = Depends(require("finding:dismiss")), s: Session = Depends(get_db)):
    return _set_status(s, u, fid, "dismissed")

def _set_status(s, u, fid, status):
    f = _visible_finding(s, u, fid)
    f.status = status; s.add(f); s.commit(); audit(s, u, f"finding_{status}", f.title)
    return {"finding": f, "health": health(visible_findings(s, u))}

# ------------------------------------------------------------------ actions
@app.get("/actions")
def actions(u: User = Depends(require("action:read")), s: Session = Depends(get_db)):
    ok = {f.id for f in visible_findings(s, u, None)}
    return [a for a in s.exec(select(Action)).all() if a.finding_id is None or a.finding_id in ok]

@app.patch("/actions/{aid}")
def patch_action(aid: int, status: str | None = None, assignee: str | None = None, snooze_days: int | None = None,
                 u: User = Depends(current_user), s: Session = Depends(get_db)):
    a = s.get(Action, aid)
    if not a: raise HTTPException(404)
    own = u.username in (a.created_by, a.assignee)
    if not (can(u, "action:update_any") or (can(u, "action:update_own") and own)):
        raise HTTPException(403, "You can only update actions you created or own")
    if assignee:
        if not can(u, "action:assign"): raise HTTPException(403, "Only managers and admins can assign actions")
        a.assignee = assignee
    if status: a.status = status
    if snooze_days: a.due = (a.due or date.today()) + timedelta(days=snooze_days)
    s.add(a); s.commit(); audit(s, u, "action_updated", f"#{a.id} {a.status}")
    return a

# ------------------------------------------------------------------ compare + dashboard
@app.get("/compare")
def compare_docs(a: str, b: str, u: User = Depends(require("compare:run")), s: Session = Depends(get_db)):
    ok = {d.name: d for d in visible_docs(s, u)}
    if a not in ok or b not in ok: raise HTTPException(404, "Document not found")
    ch = compare({"fields": ok[a].fields}, {"fields": ok[b].fields})
    return {"a": a, "b": b, "changes": ch, "summary": f"{len(ch)} important changes between {a} and {b}"}

@app.get("/dashboard")
def dashboard(u: User = Depends(current_user), s: Session = Depends(get_db)):
    fs = visible_findings(s, u)
    done = len(s.exec(select(Action).where(Action.status == "Completed")).all())
    return {"role": u.role, "documents": len(visible_docs(s, u)),
            "critical": sum(f.severity == "CRITICAL" for f in fs),
            "conflicts": sum(f.kind == "conflict" for f in fs),
            "actions_completed": done, "health": health(fs)["score"]}

# ------------------------------------------------------------------ insights, graph, ask
@app.get("/insights")
def insights(u: User = Depends(current_user), s: Session = Depends(get_db)):
    fs = visible_findings(s, u)
    count = lambda xs: {k: sum(1 for x in xs if x == k) for k in sorted(set(xs))}
    return {"by_severity": count([f.severity for f in fs]), "by_kind": count([f.kind for f in fs]),
            "actions": count([a.status for a in s.exec(select(Action)).all()]),
            "resolved": len(visible_findings(s, u, "resolved")), "health": health(fs)["score"]}

@app.get("/graph")
def graph(u: User = Depends(require("doc:read")), s: Session = Depends(get_db)):
    docs = visible_docs(s, u)
    conflicts = [set(f.docs) for f in visible_findings(s, u) if f.kind == "conflict"]
    open_by_doc = {}
    for f in visible_findings(s, u):
        for n in f.docs: open_by_doc[n] = open_by_doc.get(n, 0) + 1
    edges = []
    for i, a in enumerate(docs):
        for b in docs[i + 1:]:
            ba, bb = base_and_version(a.name)[0], base_and_version(b.name)[0]
            if ba and ba == bb: kind = "version"
            elif a.entity and a.entity == b.entity: kind = "shared entity"
            else: continue
            edges.append({"a": a.name, "b": b.name, "type": kind, "entity": a.entity,
                          "conflict": {a.name, b.name} in conflicts})
    return {"nodes": [{"id": d.name, "classification": d.classification, "findings": open_by_doc.get(d.name, 0)} for d in docs],
            "edges": edges}

class AskIn(BaseModel):
    question: str

KINDS = {"deadline": ("deadline", "due", "expire", "payment", "late"), "conflict": ("conflict", "differ", "mismatch", "disagree"),
         "change": ("change", "version", "expiry", "modified"), "missing": ("missing", "verif", "incomplete")}
STOP = {"what", "which", "show", "about", "documents", "document", "have", "need", "needs", "recently", "that", "this", "with", "from"}

@app.post("/ask")
def ask(body: AskIn, u: User = Depends(require("finding:read")), s: Session = Depends(get_db)):
    q = body.question.lower()
    fs = sorted(visible_findings(s, u), key=lambda f: -f.score)
    kind = next((k for k, w in KINDS.items() if any(x in q for x in w)), None)
    words = [w for w in re.findall(r"[a-z]{4,}", q) if w not in STOP]
    hits = [f for f in fs if (kind and f.kind == kind) or any(w in (f.title + f.what).lower() for w in words)]
    reasoning = f"Matched your question to {kind} findings" if kind and hits else "Searched finding text for your keywords" if hits else "No direct match; showing your top priorities"
    hits = hits or fs[:3]
    if not hits:
        return {"answer": "Nothing needs attention right now.", "items": [], "confidence": 100, "reasoning": reasoning}
    return {"answer": f"I found {len(hits)} relevant finding{'s' if len(hits) != 1 else ''}.", "reasoning": reasoning,
            "confidence": round(sum(f.confidence for f in hits) / len(hits)),
            "items": [{"id": f.id, "title": f.title, "what": f.what, "why": f.why, "next": f.next, "source": f.source, "severity": f.severity} for f in hits]}
