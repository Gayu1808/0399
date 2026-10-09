# InfoMind AI — Understand. Connect. Act.
Document intelligence platform: finds conflicts, changes, deadlines and gaps across documents, explains why they matter, scores priority and turns findings into actions.

## Run everything (Docker)
```
cp .env.example .env      # set real secrets
docker compose up --build
```
Open http://localhost:8080 — sign in as `admin`, `manager`, `analyst` or `viewer` (password `demo1234`; set `INFOMIND_DEMO_PASSWORD`).
`INFOMIND_SEED_DEMO=1` loads 7 demo documents; set it to 0 for an empty production workspace.

## Run without Docker (dev)
```
cd backend && pip install -r requirements.txt && INFOMIND_SEED_DEMO=1 uvicorn app.main:app --reload   # SQLite by default
cd frontend && npm install && npm run dev                                                              # http://localhost:5173
```
## Architecture
React + Vite + Tailwind + Recharts → FastAPI (RBAC, JWT, audit) → analysis pipeline (parse → extract → match → detect → score → explain) → PostgreSQL (SQLite in dev).
Roles: viewer < analyst < manager < admin; documents are internal / confidential / restricted and findings are hidden above a user's clearance. See backend/README.md.
Sample files to upload: backend/samples/. Tests: `cd backend && pytest`.
