"""Authentication + role-based access control (RBAC) + document clearance."""
import os, hmac, hashlib, secrets
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from .db import get_db
from .models import User, AuditLog, Document, Finding

SECRET = os.getenv("INFOMIND_SECRET", "dev-secret-change-me")   # MUST be set in production
oauth2 = OAuth2PasswordBearer(tokenUrl="auth/login")

# ---- Roles -> permissions. One place to read and change the whole access model.
PERMS = {
    "viewer":  {"doc:read", "finding:read", "compare:run", "action:read"},
    "analyst": {"doc:read", "finding:read", "compare:run", "action:read",
                "doc:upload", "action:create", "action:update_own"},
    "manager": {"doc:read", "finding:read", "compare:run", "action:read",
                "doc:upload", "action:create", "action:update_own",
                "finding:resolve", "finding:dismiss", "action:assign", "action:update_any"},
}
PERMS["admin"] = PERMS["manager"] | {"doc:delete", "user:manage", "audit:read"}

# ---- Document sensitivity: a user only sees documents at or below their clearance.
LEVELS = {"internal": 1, "confidential": 2, "restricted": 3}
CLEARANCE = {"viewer": 1, "analyst": 1, "manager": 2, "admin": 3}
SENSITIVE_HINTS = ("salary", "payroll", "hr_", "medical")       # auto-classified confidential

def auto_classify(name: str) -> str:
    return "confidential" if any(h in name.lower() for h in SENSITIVE_HINTS) else "internal"

# ---- Passwords & tokens
def hash_pw(pw: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(8)
    h = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 120_000).hex()
    return f"{salt}${h}"

def verify_pw(pw: str, stored: str) -> bool:
    salt, _ = stored.split("$")
    return hmac.compare_digest(hash_pw(pw, salt), stored)

def make_token(u: User) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=8)
    return jwt.encode({"sub": u.username, "role": u.role, "exp": exp}, SECRET, algorithm="HS256")

def current_user(token: str = Depends(oauth2), s: Session = Depends(get_db)) -> User:
    try:
        name = jwt.decode(token, SECRET, algorithms=["HS256"])["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired session", headers={"WWW-Authenticate": "Bearer"})
    u = s.exec(select(User).where(User.username == name)).first()
    if not u or not u.active:                       # re-check DB: disabling a user takes effect instantly
        raise HTTPException(401, "Account disabled")
    return u

def require(perm: str):
    def dep(u: User = Depends(current_user)) -> User:
        if perm not in PERMS[u.role]:
            raise HTTPException(403, f"Your role ({u.role}) cannot perform '{perm}'")
        return u
    return dep

def can(u: User, perm: str) -> bool:
    return perm in PERMS[u.role]

# ---- Visibility helpers
def visible_docs(s: Session, u: User) -> list[Document]:
    return [d for d in s.exec(select(Document)).all() if LEVELS[d.classification] <= CLEARANCE[u.role]]

def visible_findings(s: Session, u: User, status: str | None = "open") -> list[Finding]:
    ok = {d.name for d in visible_docs(s, u)}
    q = select(Finding) if status is None else select(Finding).where(Finding.status == status)
    # a finding is hidden if ANY document it cites is above the user's clearance
    return [f for f in s.exec(q).all() if all(n in ok for n in f.docs)]

def audit(s: Session, u: User | str, event: str, target: str = ""):
    s.add(AuditLog(username=u if isinstance(u, str) else u.username, event=event, target=target))
    s.commit()

def seed_users(s: Session):
    pw = os.getenv("INFOMIND_DEMO_PASSWORD", "demo1234")
    for name, full, role in [("admin", "Asha Admin", "admin"), ("manager", "Meera Manager", "manager"),
                             ("analyst", "Arun Analyst", "analyst"), ("viewer", "Vikram Viewer", "viewer")]:
        if not s.exec(select(User).where(User.username == name)).first():
            s.add(User(username=name, full_name=full, role=role, password_hash=hash_pw(pw)))
    s.commit()
