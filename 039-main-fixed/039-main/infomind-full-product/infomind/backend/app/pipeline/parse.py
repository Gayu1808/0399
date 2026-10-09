"""Step 1 - PARSE: file -> [(page_number, text)]"""
from pathlib import Path

def parse_file(path: str) -> list[tuple[int, str]]:
    ext = Path(path).suffix.lower()
    if ext == ".pdf":
        import fitz  # PyMuPDF
        with fitz.open(path) as doc:
            return [(i + 1, p.get_text()) for i, p in enumerate(doc)]
    if ext == ".docx":
        import docx
        text = "\n".join(p.text for p in docx.Document(path).paragraphs)
        return [(1, text)]
    # txt / md fallback; "\f" splits pages
    raw = Path(path).read_text(encoding="utf-8", errors="ignore")
    return [(i + 1, t) for i, t in enumerate(raw.split("\f"))]
