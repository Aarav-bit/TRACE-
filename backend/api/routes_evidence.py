import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.models import (
    Case,
    EvidenceEvent,
    Finding,
    FindingEvidence,
    EvidenceRelationship,
)
from backend.database.schemas import (
    EvidenceEventResponse,
    FindingResponse,
    FindingEvidenceResponse,
    EvidenceRelationshipResponse,
)
from backend.database.session import get_db
from backend.tools.trace_process import trace_process_handler

router = APIRouter(prefix="/api/cases/{case_id}", tags=["evidence"])

@router.get("/timeline", response_model=List[EvidenceEventResponse])
def get_timeline(
    case_id: str,
    event_type: Optional[str] = None,
    user: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = (
        db.query(EvidenceEvent)
        .filter(EvidenceEvent.case_id == case_id)
        .order_by(EvidenceEvent.timestamp_utc.asc())
    )

    if event_type:
        query = query.filter(EvidenceEvent.event_type == event_type)

    events = query.limit(limit).all()

    results = []
    for ev in events:
        norm = ev.normalized_fields
        if user and user.lower() not in str(norm.get("user", "")).lower():
            continue
        if search:
            s_term = search.lower()
            str_repr = f"{ev.event_type} {norm.get('command_line', '')} {norm.get('file_path', '')} {norm.get('process_name', '')}".lower()
            if s_term not in str_repr:
                continue
        results.append(ev)

    return results

@router.get("/findings", response_model=List[FindingResponse])
def get_findings(case_id: str, db: Session = Depends(get_db)):
    findings = (
        db.query(Finding)
        .filter(Finding.case_id == case_id)
        .order_by(Finding.created_at.asc())
        .all()
    )

    results = []
    for f in findings:
        links = (
            db.query(FindingEvidence)
            .filter(FindingEvidence.finding_id == f.id)
            .all()
        )
        link_responses = []
        for l in links:
            ev_rec = db.query(EvidenceEvent).filter(EvidenceEvent.id == l.evidence_event_id).first()
            link_responses.append(
                FindingEvidenceResponse(
                    evidence_event_id=l.evidence_event_id,
                    relationship_type=l.relationship_type,
                    explanation=l.explanation,
                    source_record_id=ev_rec.source_record_id if ev_rec else None,
                    event_type=ev_rec.event_type if ev_rec else None,
                    timestamp_utc=ev_rec.timestamp_utc if ev_rec else None,
                )
            )

        v_details = json.loads(f.verification_details_json) if f.verification_details_json else {}
        resp = FindingResponse.model_validate(f)
        resp.verification_details = v_details
        resp.evidence_links = link_responses
        results.append(resp)

    return results

@router.get("/evidence/{evidence_id}", response_model=EvidenceEventResponse)
def get_evidence_event(case_id: str, evidence_id: str, db: Session = Depends(get_db)):
    ev = (
        db.query(EvidenceEvent)
        .filter(EvidenceEvent.case_id == case_id, EvidenceEvent.id == evidence_id)
        .first()
    )
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence event not found")
    return ev

@router.get("/process_tree")
def get_process_tree(case_id: str, db: Session = Depends(get_db)):
    result = trace_process_handler(db=db, case_id=case_id)
    return result.data

@router.get("/graph")
def get_evidence_graph(case_id: str, db: Session = Depends(get_db)):
    """
    Transforms database EvidenceRelationships, processes, and findings into
    React Flow nodes and edges with distinct styling.
    """
    relationships = (
        db.query(EvidenceRelationship)
        .filter(EvidenceRelationship.case_id == case_id)
        .all()
    )

    events = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case_id).all()
    findings = db.query(Finding).filter(Finding.case_id == case_id).all()

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    seen_nodes = set()

    def add_node(node_id: str, label: str, node_type: str, metadata: Dict[str, Any] = None):
        if node_id not in seen_nodes:
            seen_nodes.add(node_id)
            # Layout coordinates will be calculated or auto-positioned by client
            nodes.append({
                "id": node_id,
                "type": node_type,
                "data": {
                    "label": label,
                    "type": node_type,
                    "metadata": metadata or {},
                },
                "position": {"x": (len(nodes) % 4) * 260 + 50, "y": (len(nodes) // 4) * 160 + 50},
            })

    # Add entity relationships
    for rel in relationships:
        src = rel.source_entity_id
        tgt = rel.target_entity_id
        src_type = src.split(":")[0].lower() if ":" in src else "entity"
        tgt_type = tgt.split(":")[0].lower() if ":" in tgt else "entity"

        add_node(src, src, src_type)
        add_node(tgt, tgt, tgt_type)

        edges.append({
            "id": f"e-{rel.id}",
            "source": src,
            "target": tgt,
            "label": rel.relationship_type,
            "animated": rel.relationship_class == "inferred",
            "data": {
                "criteria": rel.matching_criteria,
                "relationship_class": rel.relationship_class,
                "status": rel.verification_status,
            },
        })

    # Add verified findings as anchor nodes linked to evidence
    for f in findings:
        f_node_id = f"Finding:{f.id[:8]}"
        add_node(f_node_id, f.title, "finding", {"status": f.status, "claim": f.claim})
        for l in f.evidence_links:
            ev = db.query(EvidenceEvent).filter(EvidenceEvent.id == l.evidence_event_id).first()
            if ev:
                target_proc = ev.normalized_fields.get("process_name")
                target_pid = ev.normalized_fields.get("pid")
                target_node = f"Process:{target_proc}[PID {target_pid}]" if target_proc and target_pid else None
                if target_node and target_node in seen_nodes:
                    edges.append({
                        "id": f"e-find-{f.id[:6]}-{ev.id[:6]}-{len(edges)}",
                        "source": f_node_id,
                        "target": target_node,
                        "label": l.relationship_type,
                        "animated": True,
                        "data": {"explanation": l.explanation},
                    })

    return {"nodes": nodes, "edges": edges}
