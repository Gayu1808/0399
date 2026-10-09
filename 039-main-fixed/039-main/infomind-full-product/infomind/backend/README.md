# InfoMind AI backend (with role-based access)
```
pip install -r requirements.txt
export INFOMIND_SECRET="<long random string>"      # required outside local dev
uvicorn app.main:app --reload                      # docs: http://localhost:8000/docs
pytest -q
```
Demo logins (password `demo1234`, change via INFOMIND_DEMO_PASSWORD): admin, manager, analyst, viewer.

## Access model (see app/auth.py)
| Capability | Viewer | Analyst | Manager | Admin |
|---|---|---|---|---|
| View documents / findings / compare | ✓ | ✓ | ✓ | ✓ |
| Upload documents | | ✓ | ✓ | ✓ |
| Create actions | | ✓ | ✓ | ✓ |
| Update own actions | | ✓ | ✓ | ✓ |
| Update / assign any action | | | ✓ | ✓ |
| Resolve / dismiss findings | | | ✓ | ✓ |
| Delete documents | | | | ✓ |
| Manage users, read audit log | | | | ✓ |

Document sensitivity: internal (all), confidential (manager+), restricted (admin). Findings that cite a
document above your clearance are hidden, and dashboard numbers are computed only from what you can see.
