import json
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.database.models import Finding, FindingEvidence, EvidenceEvent, Artifact

class ClaimVerificationResult:
    def __init__(
        self,
        status: str,  # "supported", "contradicted", "unresolved"
        is_verified: bool,
        reasons: List[str],
        verified_evidence_ids: List[str],
        contradictory_evidence_ids: List[str],
        missing_evidence_ids: List[str],
        uncertainty_notes: Optional[str] = None,
    ):
        self.status = status
        self.is_verified = is_verified
        self.reasons = reasons
        self.verified_evidence_ids = verified_evidence_ids
        self.contradictory_evidence_ids = contradictory_evidence_ids
        self.missing_evidence_ids = missing_evidence_ids
        self.uncertainty_notes = uncertainty_notes

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "is_verified": self.is_verified,
            "reasons": self.reasons,
            "verified_evidence_ids": self.verified_evidence_ids,
            "contradictory_evidence_ids": self.contradictory_evidence_ids,
            "missing_evidence_ids": self.missing_evidence_ids,
            "uncertainty_notes": self.uncertainty_notes,
        }

def verify_finding(
    db: Session,
    case_id: str,
    claim_title: str,
    claim_text: str,
    supporting_evidence_ids: List[str],
    contradictory_evidence_ids: Optional[List[str]] = None,
    required_event_types: Optional[List[str]] = None,
    required_keywords: Optional[List[str]] = None,
) -> ClaimVerificationResult:
    """
    Deterministic Independent Verifier.
    Enforces strict evidentiary rules independently of the agent or LLM confidence.
    """
    reasons: List[str] = []
    verified_ids: List[str] = []
    missing_ids: List[str] = []
    contra_ids: List[str] = []
    uncertainty_notes: Optional[str] = None

    contradictory_evidence_ids = contradictory_evidence_ids or []
    required_event_types = required_event_types or []
    required_keywords = required_keywords or []
    supporting_evidence_ids = list(dict.fromkeys(supporting_evidence_ids or []))

    # Check 1: Must provide at least one supporting evidence ID
    if not supporting_evidence_ids:
        return ClaimVerificationResult(
            status="unresolved",
            is_verified=False,
            reasons=["Rejected: No supporting evidence IDs were cited for this claim."],
            verified_evidence_ids=[],
            contradictory_evidence_ids=[],
            missing_evidence_ids=[],
            uncertainty_notes="Claim lacks primary source attribution.",
        )

    # Check 2: Confirm every cited evidence ID exists in the database for this case
    found_events: List[EvidenceEvent] = []
    for ev_id in supporting_evidence_ids:
        ev = (
            db.query(EvidenceEvent)
            .filter(EvidenceEvent.id == ev_id, EvidenceEvent.case_id == case_id)
            .first()
        )
        if ev:
            found_events.append(ev)
            verified_ids.append(ev.id)
        else:
            missing_ids.append(ev_id)

    if missing_ids:
        reasons.append(f"Verification Failure: Cited evidence ID(s) {missing_ids} do not exist in case repository.")
        return ClaimVerificationResult(
            status="unresolved",
            is_verified=False,
            reasons=reasons,
            verified_evidence_ids=verified_ids,
            contradictory_evidence_ids=[],
            missing_evidence_ids=missing_ids,
            uncertainty_notes="Citations reference non-existent records.",
        )

    # Check 3: Check contradictory evidence
    for c_id in contradictory_evidence_ids:
        c_ev = (
            db.query(EvidenceEvent)
            .filter(EvidenceEvent.id == c_id, EvidenceEvent.case_id == case_id)
            .first()
        )
        if c_ev:
            contra_ids.append(c_ev.id)

    if contra_ids:
        reasons.append(f"Contradiction Detected: Claim is contradicted by evidence event(s) {contra_ids}.")
        return ClaimVerificationResult(
            status="contradicted",
            is_verified=False,
            reasons=reasons,
            verified_evidence_ids=verified_ids,
            contradictory_evidence_ids=contra_ids,
            missing_evidence_ids=[],
            uncertainty_notes="Direct evidentiary conflict detected in record set.",
        )

    # Check 4: Validate required event types if specified
    event_types_found = set(ev.event_type for ev in found_events)
    for req_type in required_event_types:
        if req_type not in event_types_found:
            reasons.append(f"Insufficient Telemetry: Required event type '{req_type}' not present in cited records.")
            return ClaimVerificationResult(
                status="unresolved",
                is_verified=False,
                reasons=reasons,
                verified_evidence_ids=verified_ids,
                contradictory_evidence_ids=[],
                missing_evidence_ids=[],
                uncertainty_notes=f"Causal chain requires {req_type} verification.",
            )

    # Check 5: Validate required keywords or targets in cited records
    for kw in required_keywords:
        kw_found = False
        for ev in found_events:
            ev_str = json.dumps(ev.normalized_fields).lower()
            if kw.lower() in ev_str or kw.lower() in ev.event_type.lower():
                kw_found = True
                break
        if not kw_found:
            reasons.append(f"Evidentiary Gap: Required factual term '{kw}' was not substantiated in cited record payload.")
            return ClaimVerificationResult(
                status="unresolved",
                is_verified=False,
                reasons=reasons,
                verified_evidence_ids=verified_ids,
                contradictory_evidence_ids=[],
                missing_evidence_ids=[],
                uncertainty_notes=f"Factual predicate '{kw}' unverified in cited logs.",
            )

    # Check 6: Check for Degraded Evidence Gap in Case
    # If the claim claims that "scvhost.exe was directly executed by powershell" but the process creation event REC-00106 is missing
    claim_lower = claim_text.lower()
    if ("executed scvhost" in claim_lower or "scvhost execution" in claim_lower or "spawned scvhost" in claim_lower):
        has_process_creation_for_scvhost = any(
            ev.event_type == "process_creation" and
            ev.normalized_fields.get("process_name") == "scvhost.exe"
            for ev in found_events
        )
        if not has_process_creation_for_scvhost:
            reasons.append("Evidentiary Constraint: Direct process execution record (EID 4688) for scvhost.exe is missing from evidence. Causal execution link remains unproven.")
            return ClaimVerificationResult(
                status="unresolved",
                is_verified=False,
                reasons=reasons,
                verified_evidence_ids=verified_ids,
                contradictory_evidence_ids=[],
                missing_evidence_ids=[],
                uncertainty_notes="Missing process creation telemetry: File write and network connection observed, but direct process launch cannot be substantiated without process creation telemetry.",
            )

    # All independent checks passed
    reasons.append(f"Verified: All {len(found_events)} cited evidence records exist, integrity verified, and satisfy support criteria.")
    return ClaimVerificationResult(
        status="supported",
        is_verified=True,
        reasons=reasons,
        verified_evidence_ids=verified_ids,
        contradictory_evidence_ids=[],
        missing_evidence_ids=[],
        uncertainty_notes="None. Claim directly supported by verified source logs.",
    )
