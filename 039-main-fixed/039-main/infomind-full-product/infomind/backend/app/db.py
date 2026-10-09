import os
from sqlmodel import Session, create_engine
URL = os.getenv("DATABASE_URL", "sqlite:///infomind.db")      # postgresql+psycopg2://user:pw@host/db in Docker
kw = {"connect_args": {"check_same_thread": False}} if URL.startswith("sqlite") else {"pool_pre_ping": True}
engine = create_engine(URL, **kw)

def get_db():
    with Session(engine, expire_on_commit=False) as s:
        yield s
