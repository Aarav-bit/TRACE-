from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse, PlainTextResponse
from sqlalchemy.orm import Session
from backend.database.models import Case
from backend.database.session import get_db
from backend.reporting.generator import generate_report_markdown, generate_report_html

router = APIRouter(prefix="/api/cases/{case_id}/report", tags=["reporting"])

@router.get("", response_class=PlainTextResponse)
def get_report_markdown(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    md = generate_report_markdown(db, case_id)
    return PlainTextResponse(content=md, media_type="text/markdown")

@router.get("/html", response_class=HTMLResponse)
def get_report_html_view(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    html = generate_report_html(db, case_id)
    return HTMLResponse(content=html)
