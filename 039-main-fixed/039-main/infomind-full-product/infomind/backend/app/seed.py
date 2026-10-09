"""Demo data so a fresh install shows a populated, believable workspace."""
from datetime import date, timedelta
from sqlmodel import Session, select
from .models import Document, Action
from .auth import auto_classify
from .pipeline.extract import extract_fields
from .service import reanalyze, today

def seed_demo(s: Session):
    if s.exec(select(Document)).first():
        return
    t = (today() + timedelta(days=1)).strftime("%d %b %Y")
    docs = {
        "Fee_Schedule.pdf": [(1, "Name: Term Fees\nLate fee: ₹500"), (2, f"Payment deadline: {t}")],
        "Salary_Report.pdf": [(3, "Employee: Ravi Kumar\nMonthly salary: ₹45,000")],
        "HR_Record.pdf": [(2, "Employee: Ravi Kumar\nMonthly salary: ₹42,000")],
        "Contract_v1.pdf": [(1, "Contract: Nova Supplies\nExpiry date: 30 Nov 2026\nPenalty clause: 2% per week\nSignature: signed")],
        "Contract_v2.pdf": [(1, "Contract: Nova Supplies\nExpiry date: 15 Dec 2026\nAuto renewal: Yes, 12 months\nSignature: signed")],
        "Application_12.pdf": [(4, "Applicant: Divya S\nIdentity verification: not attached")],
        "Payment_Record.pdf": [(1, "Name: Payment Log\nLast payment: ₹18,500")],
    }
    for name, pages in docs.items():
        ext = extract_fields(pages)
        s.add(Document(name=name, doc_type="pdf", classification=auto_classify(name), uploaded_by="system",
                       entity=ext["entity"], fields=ext["fields"]))
    s.commit()
    reanalyze(s)
    s.add(Action(title="Confirm payment deadline", priority="CRITICAL", status="In Progress",
                 due=today() + timedelta(days=1), created_by="manager", assignee="analyst"))
    s.commit()
