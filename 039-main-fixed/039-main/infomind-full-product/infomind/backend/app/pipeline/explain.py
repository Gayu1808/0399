"""Step 6 - EXPLAIN: WHAT / WHY / SOURCE / IMPACT / NEXT.
Templates here are the safe baseline. To use an LLM, pass the structured finding
to it and ask ONLY for rewording - never to invent facts."""
def _src(f, key):
    return f"{key} — Page {f['page']}"

def explain(f: dict) -> dict:
    k, fld = f["kind"], f["field"].replace("_", " ")
    if k == "change":
        ch = f["change"]
        a, b = (ch["a"] or {}), (ch["b"] or {})
        return dict(title=f"{fld.title()} {ch['status'].lower()} in {f['docs'][1]}",
            what=f"{fld.title()} {ch['status'].lower()}: {a.get('raw','—')} → {b.get('raw','—')}.",
            why=f"The latest version differs from {f['docs'][0]}.",
            source=[_src(a, f["docs"][0]) if a else f["docs"][0], _src(b, f["docs"][1]) if b else f["docs"][1]],
            impact="Planning that relies on this term may be affected.",
            next=f"Review and confirm the updated {fld}.")
    if k == "conflict":
        a, b = f["a"], f["b"]
        return dict(title=f"{fld.title()} conflict for {f['entity']}",
            what=f"{f['docs'][0]} says {a['raw']}; {f['docs'][1]} says {b['raw']}.",
            why="Two documents hold different values for the same record.",
            source=[_src(a, f["docs"][0]), _src(b, f["docs"][1])],
            impact="Decisions or payments based on the wrong value may be inaccurate.",
            next="Verify the latest approved record and correct the other.")
    if k == "deadline":
        d = f["days"]
        when = "is overdue" if d < 0 else "is today" if d == 0 else f"is in {d} day(s)"
        return dict(title=f"{fld.title()} {when}", what=f"{fld.title()}: {f['f']['raw']}.",
            why="Time-sensitive date detected in the document.",
            source=[_src(f["f"], f["docs"][0])],
            impact="Missing it may incur penalties or lapse an agreement.",
            next="Confirm status and complete the required step.")
    return dict(title=f"Missing {fld} in {f['docs'][0]}", what=f"No valid {fld} found.",
        why="This document type requires the field.", source=[f["docs"][0]],
        impact="The record cannot be approved or verified.", next=f"Upload or enter the {fld}.")
