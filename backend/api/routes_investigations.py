import asyncio
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.agent.engine import (
    coordinator,
    start_investigation_background,
)
from backend.database.models import Case, Investigation, InvestigationAction
from backend.database.schemas import (
    InvestigationCreate,
    InvestigationResponse,
    InvestigationActionResponse,
    FailureInjectionRequest,
)
from backend.database.session import get_db

router = APIRouter(tags=["investigations"])

@router.post("/api/cases/{case_id}/investigations", response_model=InvestigationResponse)
def start_investigation(
    case_id: str,
    payload: Optional[InvestigationCreate] = None,
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    mode = payload.mode if payload else "deterministic"
    max_steps = payload.max_steps if payload else 12
    obj = payload.objective if payload and payload.objective else case.objective

    investigation = Investigation(
        case_id=case.id,
        status="pending",
        objective=obj,
        mode=mode,
        max_steps=max_steps,
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)

    # Launch background agent loop
    start_investigation_background(investigation.id)

    return investigation

@router.get("/api/investigations/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(investigation_id: str, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    actions = (
        db.query(InvestigationAction)
        .filter(InvestigationAction.investigation_id == investigation_id)
        .order_by(InvestigationAction.sequence_number.asc())
        .all()
    )

    action_responses = []
    for a in actions:
        inputs = json.loads(a.validated_inputs_json) if a.validated_inputs_json else {}
        struct_res = json.loads(a.structured_result_json) if a.structured_result_json else {}
        action_responses.append(
            InvestigationActionResponse(
                id=a.id,
                investigation_id=a.investigation_id,
                sequence_number=a.sequence_number,
                tool_name=a.tool_name,
                action_type=a.action_type,
                rationale=a.rationale,
                validated_inputs=inputs,
                status=a.status,
                result_summary=a.result_summary,
                structured_result=struct_res,
                error_details=a.error_details,
                retry_count=a.retry_count,
                started_at=a.started_at,
                completed_at=a.completed_at,
            )
        )

    resp = InvestigationResponse.model_validate(inv)
    resp.actions = action_responses
    return resp

@router.post("/api/investigations/{investigation_id}/pause")
def pause_investigation(investigation_id: str, db: Session = Depends(get_db)):
    coordinator.set_control(investigation_id, "pause")
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if inv:
        inv.status = "paused"
        db.commit()
    return {"success": True, "status": "paused"}

@router.post("/api/investigations/{investigation_id}/resume")
def resume_investigation(investigation_id: str, db: Session = Depends(get_db)):
    coordinator.set_control(investigation_id, "resume")
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if inv:
        inv.status = "running"
        db.commit()
    return {"success": True, "status": "resumed"}

@router.post("/api/investigations/{investigation_id}/stop")
def stop_investigation(investigation_id: str, db: Session = Depends(get_db)):
    coordinator.set_control(investigation_id, "stop")
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if inv:
        inv.status = "stopped"
        inv.termination_reason = "Manually stopped by investigator."
        db.commit()
    return {"success": True, "status": "stopped"}

@router.post("/api/investigations/{investigation_id}/fail")
def inject_failure(
    investigation_id: str,
    payload: FailureInjectionRequest,
    db: Session = Depends(get_db)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    case = db.query(Case).filter(Case.id == inv.case_id).first()
    if not case or not case.is_demo:
        raise HTTPException(status_code=400, detail="Failure injection is only permitted on simulated demo cases.")

    inv.simulated_failure = payload.failure_type
    db.commit()

    return {
        "success": True,
        "message": f"Simulated failure '{payload.failure_type}' armed for next investigation action.",
    }

@router.get("/api/investigations/{investigation_id}/events")
async def stream_events(investigation_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Server-Sent Events (SSE) live investigation trace endpoint.
    Emits real-time agent planning, execution, failure recovery, and finding events.
    """
    queue = coordinator.subscribe(investigation_id)

    async def event_generator():
        # First send historical actions so client gets replay on reconnect
        try:
            hist_actions = (
                db.query(InvestigationAction)
                .filter(InvestigationAction.investigation_id == investigation_id)
                .order_by(InvestigationAction.sequence_number.asc())
                .all()
            )
            for a in hist_actions:
                yield f"data: {json.dumps({'type': 'action_completed' if a.status == 'completed' else 'action_failed', 'action': {'id': a.id, 'sequence_number': a.sequence_number, 'tool_name': a.tool_name, 'status': a.status, 'result_summary': a.result_summary, 'error_details': a.error_details, 'completed_at': a.completed_at.isoformat() if a.completed_at else None}})}\n\n"

            while True:
                if await request.is_disconnected():
                    break
                try:
                    # Non-blocking wait with timeout for keep-alive ping
                    data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            coordinator.unsubscribe(investigation_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
