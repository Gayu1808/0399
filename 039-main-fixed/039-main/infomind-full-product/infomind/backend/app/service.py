"""Orchestrates the chain: FIND -> UNDERSTAND -> CONNECT -> ANALYZE -> PRIORITIZE"""
import os
from datetime import date
from sqlmodel import Session, select
from .models import Document, Finding
from .pipeline.detect import detect_all
from .pipeline.score import score
from .pipeline.explain import explain

def today() -> date:
    return date.fromisoformat(os.getenv("INFOMIND_TODAY", date.today().isoformat()))

def finding_key(raw: dict) -> str:
    return "|".join([raw["kind"], raw["field"], *sorted(raw["docs"])])

def reanalyze(db: Session) -> list[Finding]:
    docs = [dict(name=d.name, doc_type=d.doc_type, entity=d.entity, fields=d.fields)
            for d in db.exec(select(Document)).all()]
    existing = {f.key: f for f in db.exec(select(Finding)).all()}
    live = set()
    for raw in detect_all(docs, today()):
        key = finding_key(raw)
        live.add(key)
        s, e = score(raw), explain(raw)
        f = existing.get(key) or Finding(key=key, kind=raw["kind"], docs=raw["docs"], **{
            k: "" for k in ("title", "what", "why", "impact", "next")}, severity="", score=0, confidence=0)
        f.severity, f.score, f.confidence, f.breakdown = s["severity"], s["score"], s["confidence"], s["breakdown"]
        f.title, f.what, f.why, f.impact, f.next, f.source = e["title"], e["what"], e["why"], e["impact"], e["next"], e["source"]
        db.add(f)
    for key, f in existing.items():       # finding disappeared from the data -> auto-resolve
        if key not in live and f.status == "open":
            f.status = "resolved"; db.add(f)
    db.commit()
    return db.exec(select(Finding)).all()

def health(fs: list) -> dict:
    pen = {"CRITICAL": 8, "HIGH": 5, "MEDIUM": 2, "LOW": 1}
    return {"score": max(0, 100 - sum(pen.get(f.severity, 0) for f in fs)),
            "open_conflicts": sum(f.kind == "conflict" for f in fs)}
