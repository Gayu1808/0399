import os
os.environ["INFOMIND_TODAY"] = "2026-10-07"
from pathlib import Path
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session
from app.main import app
from app.db import engine
from app.auth import seed_users

S = Path(__file__).parent.parent / "samples"
FILES = ["Contract_v1.txt", "Contract_v2.txt", "Salary_Report.txt", "HR_Record.txt", "Fee_Schedule.txt"]

def client_as(role):
    c = TestClient(app)
    t = c.post("/auth/login", data={"username": role, "password": "demo1234"}).json()["access_token"]
    c.headers["Authorization"] = f"Bearer {t}"
    return c

def up(c, n): return c.post("/documents", files={"file": (n, (S / n).read_bytes())})

def setup_module():
    SQLModel.metadata.drop_all(engine); SQLModel.metadata.create_all(engine)
    with Session(engine) as s: seed_users(s)
    m = client_as("manager")
    for n in FILES: assert up(m, n).status_code == 200

def test_unauthenticated_and_bad_login():
    c = TestClient(app)
    assert c.get("/findings").status_code == 401
    assert c.post("/auth/login", data={"username": "admin", "password": "wrong"}).status_code == 401

def test_viewer_is_read_only_and_clearance_limited():
    v = client_as("viewer")
    assert up(v, "Contract_v1.txt").status_code == 403
    titles = [f["title"] for f in v.get("/findings").json()]
    assert not any("conflict" in t.lower() for t in titles)                # salary conflict hidden (confidential)
    assert {d["name"] for d in v.get("/documents").json()} == {"Contract_v1.txt", "Contract_v2.txt", "Fee_Schedule.txt"}
    fid = v.get("/findings").json()[0]["id"]
    assert v.post(f"/findings/{fid}/action").status_code == 403
    assert v.get("/compare", params={"a": "Salary_Report.txt", "b": "HR_Record.txt"}).status_code == 404

def test_analyst_can_create_but_not_resolve_or_assign():
    a, m = client_as("analyst"), client_as("manager")
    fid = a.get("/findings").json()[0]["id"]
    act = a.post(f"/findings/{fid}/action").json()
    assert a.patch(f"/actions/{act['id']}", params={"status": "In Progress"}).status_code == 200
    assert a.patch(f"/actions/{act['id']}", params={"assignee": "viewer"}).status_code == 403
    assert a.post(f"/findings/{fid}/resolve").status_code == 403
    other = m.post(f"/findings/{fid}/action").json()                          # manager's action
    assert a.patch(f"/actions/{other['id']}", params={"status": "Completed"}).status_code == 403

def test_manager_sees_confidential_and_resolves():
    m = client_as("manager")
    f = m.get("/findings").json()
    conflict = next(x for x in f if x["kind"] == "conflict")
    before = m.get("/dashboard").json()
    assert m.post(f"/findings/{conflict['id']}/resolve").status_code == 200
    after = m.get("/dashboard").json()
    assert after["conflicts"] == before["conflicts"] - 1 and after["health"] > before["health"]
    assert m.get("/users").status_code == 403 and m.get("/audit").status_code == 403

def test_admin_manages_users_and_audit():
    ad = client_as("admin")
    assert len(ad.get("/users").json()) == 4
    r = ad.post("/users", params={"username": "temp", "password": "longenough1", "role": "analyst"})
    assert r.status_code == 200
    uid = r.json()["id"]
    assert ad.patch(f"/users/{uid}", params={"active": False}).status_code == 200
    c = TestClient(app)
    assert c.post("/auth/login", data={"username": "temp", "password": "longenough1"}).status_code == 401
    assert any(e["event"] == "user_created" for e in ad.get("/audit").json())

def test_seed_ask_graph():
    from app.seed import seed_demo
    SQLModel.metadata.drop_all(engine); SQLModel.metadata.create_all(engine)
    with Session(engine) as s: seed_users(s); seed_demo(s)
    m, v = client_as("manager"), client_as("viewer")
    r = m.post("/ask", json={"question": "Which documents conflict?"}).json()
    assert "45,000" in r["items"][0]["what"]
    assert v.post("/ask", json={"question": "Which documents conflict?"}).json()["items"][0]["severity"] != "HIGH" or "salary" not in str(v.post("/ask", json={"question": "salary conflict"}).json()).lower()
    g = m.get("/graph").json()
    assert any(e["type"] == "version" for e in g["edges"]) and any(e["conflict"] for e in g["edges"])
    assert m.get("/dashboard").json()["critical"] >= 1
