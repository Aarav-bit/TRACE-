import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from backend.database.models import Finding, FindingEvidence, Investigation
from backend.verification.verifier import verify_finding
from backend.tools.registry import ToolExecutionResult, ToolDefinition, registry

def verify_claim_handler(
    db: Session,
    case_id: str,
    title: str,
    claim: str,
    supporting_evidence_ids: List[str],
    contradictory_evidence_ids: Optional[List[str]] = None,
    required_event_types: Optional[List[str]] = None,
    required_keywords: Optional[List[str]] = None,
    investigation_id: Optional[str] = None,
    **kwargs
) -> ToolExecutionResult:
    v_res = verify_finding(
        db=db,
        case_id=case_id,
        claim_title=title,
        claim_text=claim,
        supporting_evidence_ids=supporting_evidence_ids,
        contradictory_evidence_ids=contradictory_evidence_ids,
        required_event_types=required_event_types,
        required_keywords=required_keywords,
    )

    # Persist or update Finding in database
    existing_finding = (
        db.query(Finding)
        .filter(Finding.case_id == case_id, Finding.title == title)
        .first()
    )

    if existing_finding:
        finding = existing_finding
        finding.claim = claim
        finding.status = v_res.status
        finding.verification_details_json = json.dumps(v_res.to_dict())
        finding.uncertainty_notes = v_res.uncertainty_notes
    else:
        finding = Finding(
            case_id=case_id,
            investigation_id=investigation_id,
            title=title,
            claim=claim,
            status=v_res.status,
            confidence_assessment="High" if v_res.status == "supported" else ("Low" if v_res.status == "contradicted" else "Unresolved"),
            verification_method="independent_deterministic_verifier",
            verification_details_json=json.dumps(v_res.to_dict()),
            uncertainty_notes=v_res.uncertainty_notes,
            suggested_next_action="Accept as substantiated finding" if v_res.status == "supported" else "Seek additional endpoint telemetry",
        )
        db.add(finding)
        db.flush()

    # Link FindingEvidence
    db.query(FindingEvidence).filter(FindingEvidence.finding_id == finding.id).delete()
    for ev_id in v_res.verified_evidence_ids:
        fe = FindingEvidence(
            finding_id=finding.id,
            evidence_event_id=ev_id,
            relationship_type="supports",
            explanation="Primary forensic record verifying claim predicate.",
        )
        db.add(fe)

    for c_id in v_res.contradictory_evidence_ids:
        fe = FindingEvidence(
            finding_id=finding.id,
            evidence_event_id=c_id,
            relationship_type="contradicts",
            explanation="Contradictory telemetry conflicting with claim.",
        )
        db.add(fe)

    db.commit()

    summary = (
        f"Independent verification completed for claim '{title}': "
        f"Result is [{v_res.status.upper()}]. {v_res.reasons[0]}"
    )

    return ToolExecutionResult(
        success=True,
        summary=summary,
        data={
            "finding_id": finding.id,
            "status": v_res.status,
            "is_verified": v_res.is_verified,
            "reasons": v_res.reasons,
            "uncertainty_notes": v_res.uncertainty_notes,
        },
        evidence_ids=v_res.verified_evidence_ids,
    )

registry.register(
    ToolDefinition(
        name="verify_claim",
        display_name="Independent Claim Verifier",
        description="Submits an investigative claim and cited evidence IDs to the deterministic independent verifier for validation, rejecting unsubstantiated or contradictory conclusions.",
        category="verification",
        handler=verify_claim_handler,
        parameters_schema={
            "title": {"type": "string", "description": "Concise finding title"},
            "claim": {"type": "string", "description": "Specific factual claim text"},
            "supporting_evidence_ids": {"type": "array", "items": {"type": "string"}, "description": "List of primary evidence UUIDs"},
            "contradictory_evidence_ids": {"type": "array", "items": {"type": "string"}, "description": "List of contradictory evidence UUIDs"},
        },
    )
)
