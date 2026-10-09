from datetime import datetime, date, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON

def now(): return datetime.now(timezone.utc)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    full_name: str = ""
    role: str = "viewer"                     # viewer | analyst | manager | admin
    password_hash: str
    active: bool = True

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    at: datetime = Field(default_factory=now)
    username: str
    event: str
    target: str = ""

class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    doc_type: str = "document"
    classification: str = "internal"         # internal | confidential | restricted
    uploaded_by: str = ""
    uploaded_at: datetime = Field(default_factory=now)
    entity: Optional[str] = None
    fields: dict = Field(default_factory=dict, sa_column=Column(JSON))

class Finding(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True)
    kind: str
    severity: str
    score: int
    confidence: int
    title: str
    what: str
    why: str
    impact: str
    next: str
    source: list = Field(default_factory=list, sa_column=Column(JSON))
    docs: list = Field(default_factory=list, sa_column=Column(JSON))
    breakdown: dict = Field(default_factory=dict, sa_column=Column(JSON))
    status: str = "open"                     # open | resolved | dismissed
    created_at: datetime = Field(default_factory=now)

class Action(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    finding_id: Optional[int] = None
    title: str
    priority: str = "MEDIUM"
    due: Optional[date] = None
    status: str = "To Do"                    # To Do | In Progress | Completed
    assignee: str = ""
    created_by: str = ""
    created_at: datetime = Field(default_factory=now)
