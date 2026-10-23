from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.models import Case, Artifact, EvidenceEvent, Finding
from backend.database.schemas import CaseCreate, CaseResponse
from backend.database.session import get_db
from backend.synthetic.cases import seed_synthetic_case

router = APIRouter(prefix="/api/cases", tags=["cases"])

@router.post("", response_model=CaseResponse)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    case = Case(
        name=payload.name,
        objective=payload.objective,
        description=payload.description,
        is_demo=payload.is_demo,
        demo_type=payload.demo_type,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case

@router.get("", response_model=List[CaseResponse])
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    results = []
    for c in cases:
        art_count = db.query(Artifact).filter(Artifact.case_id == c.id).count()
        ev_count = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == c.id).count()
        find_count = db.query(Finding).filter(Finding.case_id == c.id).count()

        resp = CaseResponse.model_validate(c)
        resp.artifact_count = art_count
        resp.event_count = ev_count
        resp.finding_count = find_count
        resp.last_activity = c.updated_at
        results.append(resp)
    return results

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    art_count = db.query(Artifact).filter(Artifact.case_id == case.id).count()
    ev_count = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case.id).count()
    find_count = db.query(Finding).filter(Finding.case_id == case.id).count()

    resp = CaseResponse.model_validate(case)
    resp.artifact_count = art_count
    resp.event_count = ev_count
    resp.finding_count = find_count
    resp.last_activity = case.updated_at
    return resp

@router.delete("/{case_id}")
def delete_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
    return {"success": True, "message": "Case deleted"}

# Demo seeding endpoints
demo_router = APIRouter(prefix="/api/demo", tags=["demo"])

@demo_router.post("/seed")
def seed_demo(case_type: str = Query("complete", pattern="^(complete|degraded)$"), db: Session = Depends(get_db)):
    case = seed_synthetic_case(db, case_type=case_type)
    return {
        "success": True,
        "case_id": case.id,
        "name": case.name,
        "demo_type": case_type,
        "message": f"Synthetic demo case '{case.name}' initialized with verified evidence.",
    }

@demo_router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    db.query(Case).filter(Case.is_demo == True).delete()
    db.commit()
    case_a = seed_synthetic_case(db, case_type="complete")
    return {
        "success": True,
        "message": "Demo environment reset to baseline. Case A seeded successfully.",
        "case_id": case_a.id,
    }
