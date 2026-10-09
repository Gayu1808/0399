"""Steps 3-4 - MATCH + DETECT. Deterministic: the LLM never decides what is a finding."""
import re
from datetime import date
from .extract import IDENTITY

DEADLINE_KEYS = ("deadline", "due_date", "due", "expiry", "expires", "valid_until")
REQUIRED = {"application": ["identity_verification"], "contract": ["expiry_date"]}
PENDING = ("missing", "not attached", "pending", "none")

def base_and_version(name: str):
    m = re.match(r"(.+?)_v(\d+)\.\w+$", name, re.I)
    return (m.group(1).lower(), int(m.group(2))) if m else (None, None)

def compare(a: dict, b: dict) -> list[dict]:
    """Field-level diff of two parsed docs -> ADDED / REMOVED / CHANGED."""
    out, fa, fb = [], a["fields"], b["fields"]
    for k in sorted(set(fa) | set(fb)):
        if k in fa and k not in fb:
            out.append({"field": k, "status": "REMOVED", "a": fa[k], "b": None})
        elif k in fb and k not in fa:
            out.append({"field": k, "status": "ADDED", "a": None, "b": fb[k]})
        elif fa[k]["value"] != fb[k]["value"]:
            out.append({"field": k, "status": "CHANGED", "a": fa[k], "b": fb[k]})
    return out

def detect_all(docs: list[dict], today: date) -> list[dict]:
    """docs: [{name, doc_type, entity, fields}] -> raw findings (no score yet)."""
    found = []
    # --- version changes (contract_v1 -> contract_v2)
    groups = {}
    for d in docs:
        base, v = base_and_version(d["name"])
        if base:
            groups.setdefault(base, []).append((v, d))
    versioned = set()
    for base, items in groups.items():
        items.sort(key=lambda x: x[0])
        for (_, old), (_, new) in zip(items, items[1:]):
            versioned.add((old["name"], new["name"]))
            for ch in compare(old, new):
                if ch["status"] != "CHANGED" and ch["field"] in IDENTITY:
                    continue
                found.append({"kind": "change", "field": ch["field"], "change": ch,
                              "docs": [old["name"], new["name"]], "entity": new["entity"]})
    # --- cross-document conflicts (same entity + field, different value)
    seen = {}
    for d in docs:
        if not d["entity"]:
            continue
        for label, f in d["fields"].items():
            if label in IDENTITY or any(k in label for k in DEADLINE_KEYS):
                continue
            seen.setdefault((d["entity"], label), []).append((d, f))
    for (entity, label), items in seen.items():
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                (d1, f1), (d2, f2) = items[i], items[j]
                if (d1["name"], d2["name"]) in versioned or (d2["name"], d1["name"]) in versioned:
                    continue
                if f1["value"] != f2["value"]:
                    found.append({"kind": "conflict", "field": label, "entity": entity,
                                  "docs": [d1["name"], d2["name"]],
                                  "a": f1, "b": f2})
    # --- deadlines
    for d in docs:
        for label, f in d["fields"].items():
            if any(k in label for k in DEADLINE_KEYS):
                try:
                    days = (date.fromisoformat(f["value"]) - today).days
                except (TypeError, ValueError):
                    continue
                if -30 <= days <= 14:
                    found.append({"kind": "deadline", "field": label, "docs": [d["name"]],
                                  "entity": d["entity"], "f": f, "days": days})
    # --- missing information
    for d in docs:
        for key, req in REQUIRED.items():
            if key in d["name"].lower():
                for r in req:
                    f = d["fields"].get(r)
                    if not f or any(p in str(f["raw"]).lower() for p in PENDING):
                        found.append({"kind": "missing", "field": r, "docs": [d["name"]],
                                      "entity": d["entity"]})
    return found
