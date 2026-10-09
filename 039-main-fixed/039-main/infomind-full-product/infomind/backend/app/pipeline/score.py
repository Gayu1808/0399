"""Step 5 - PRIORITIZE. Transparent formula so it can be shown in the UI."""
W = {"impact": 0.4, "urgency": 0.3, "confidence": 0.2, "recency": 0.1}
IMPACT = {"deadline": .9, "conflict": .8, "change": .7, "missing": .55}

def score(f: dict) -> dict:
    urgency = {"deadline": lambda: 1.0 if f["days"] <= 1 else 0.8 if f["days"] <= 7 else 0.5,
               "conflict": lambda: 0.75, "change": lambda: 0.8, "missing": lambda: 0.5}[f["kind"]]()
    if f["kind"] == "deadline" and f["days"] < 0:
        urgency = 1.0  # overdue
    conf = 0.96 if f["kind"] in ("change", "deadline") else 0.91 if f["kind"] == "conflict" else 0.87
    parts = {"impact": IMPACT[f["kind"]], "urgency": urgency, "confidence": conf, "recency": 0.9}
    total = round(100 * sum(W[k] * v for k, v in parts.items()))
    sev = "CRITICAL" if total >= 90 else "HIGH" if total >= 75 else "MEDIUM" if total >= 50 else "LOW"
    return {"score": total, "severity": sev, "confidence": round(conf * 100), "breakdown": parts}
