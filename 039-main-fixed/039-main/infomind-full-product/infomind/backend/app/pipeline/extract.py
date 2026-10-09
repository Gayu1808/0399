"""Step 2 - EXTRACT: text -> structured fields with page evidence.
Rule-based so it is deterministic and demo-safe. Swap/augment `extract_fields`
with an LLM (JSON output) for messy real-world documents."""
import re
from dateutil import parser as dparse

LINE = re.compile(r"^\s*([A-Za-z][A-Za-z _/]{2,40}?)\s*[:\-–]\s*(.+?)\s*$")
AMOUNT = re.compile(r"(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)", re.I)
IDENTITY = ("employee", "name", "applicant", "vendor", "contract")
DATE_HINT = ("date", "deadline", "due", "expiry", "expires", "valid")

def norm_label(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")

def norm_value(label: str, value: str):
    """Normalise so '₹45,000' == '45000' and '30 Nov 2026' == '2026-11-30'."""
    m = AMOUNT.search(value)
    if m:
        return float(m.group(1).replace(",", ""))
    if any(h in label for h in DATE_HINT):
        try:
            return dparse.parse(value, dayfirst=True).date().isoformat()
        except (ValueError, OverflowError):
            pass
    return re.sub(r"\s+", " ", value.strip().lower())

def extract_fields(pages: list[tuple[int, str]]) -> dict:
    fields: dict[str, dict] = {}
    for page, text in pages:
        for line in text.splitlines():
            m = LINE.match(line)
            if not m:
                continue
            label = norm_label(m.group(1))
            raw = m.group(2)
            fields.setdefault(label, {"raw": raw, "value": norm_value(label, raw), "page": page})
    entity = next((fields[k]["value"] for k in fields if k in IDENTITY), None)
    return {"fields": fields, "entity": entity}
