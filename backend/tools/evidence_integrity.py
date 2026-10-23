"""Read-only provenance, hashing, and evidence-gap tools."""
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from backend.database.models import Artifact, EvidenceEvent
from backend.forensic.integrity import compute_sha256
from backend.tools.registry import ToolDefinition, ToolExecutionResult, registry


def _artifact(db: Session, case_id: str, artifact_id: str) -> Artifact | None:
    return db.query(Artifact).filter(Artifact.id == artifact_id, Artifact.case_id == case_id).first()


def calculate_hash_handler(db: Session, case_id: str, artifact_id: str, **_: Any) -> ToolExecutionResult:
    artifact = _artifact(db, case_id, artifact_id)
    if not artifact:
        return ToolExecutionResult(False, "Artifact hash request rejected.", {}, "Artifact does not belong to this case.")
    source = Path(artifact.original_storage_reference)
    if not source.is_file():
        return ToolExecutionResult(False, "Stored evidence is unavailable for hashing.", {}, "Artifact source path is missing.")
    actual = compute_sha256(source)
    matches = actual == artifact.sha256
    return ToolExecutionResult(
        matches,
        "Artifact SHA-256 matches its ingestion manifest." if matches else "Artifact SHA-256 does not match its ingestion manifest.",
        {"artifact_id": artifact.id, "recorded_sha256": artifact.sha256, "computed_sha256": actual, "integrity_status": "verified" if matches else "mismatch"},
        None if matches else "Evidence integrity mismatch detected",
    )


def inspect_provenance_handler(db: Session, case_id: str, artifact_id: str, **_: Any) -> ToolExecutionResult:
    artifact = _artifact(db, case_id, artifact_id)
    if not artifact:
        return ToolExecutionResult(False, "Provenance request rejected.", {}, "Artifact does not belong to this case.")
    events = db.query(EvidenceEvent).filter(EvidenceEvent.artifact_id == artifact.id).all()
    return ToolExecutionResult(
        True,
        f"Returned immutable provenance manifest for {artifact.original_filename} and {len(events)} normalized records.",
        {
            "artifact_id": artifact.id,
            "source_filename": artifact.original_filename,
            "source_reference": artifact.original_storage_reference,
            "sha256": artifact.sha256,
            "parser": artifact.parser_name,
            "parser_status": artifact.parser_status,
            "record_count": artifact.record_count,
            "evidence_ids": [event.id for event in events],
        },
        evidence_ids=[event.id for event in events],
    )


def check_evidence_gaps_handler(db: Session, case_id: str, **_: Any) -> ToolExecutionResult:
    events = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case_id).all()
    types = {event.event_type for event in events}
    gaps = [
        message for event_type, message in {
            "process_creation": "No process creation telemetry: execution cannot be established from file presence alone.",
            "file_activity": "No file activity telemetry: file-write attribution is unavailable.",
            "network_connection": "No network connection telemetry: network activity cannot be corroborated.",
            "user_logon": "No authentication telemetry: account context is incomplete.",
        }.items() if event_type not in types
    ]
    return ToolExecutionResult(True, f"Identified {len(gaps)} evidence gap(s).", {"event_types": sorted(types), "gaps": gaps})


required_artifact = {"type": "string", "description": "Case-owned artifact UUID", "required": True}
registry.register(ToolDefinition("calculate_sha256", "Calculate SHA-256", "Recomputes an artifact hash and compares it with the ingestion manifest.", "integrity", calculate_hash_handler, {"artifact_id": required_artifact}))
registry.register(ToolDefinition("inspect_provenance", "Inspect Evidence Provenance", "Returns source, parser, hash, and normalized-record lineage for one case artifact.", "integrity", inspect_provenance_handler, {"artifact_id": required_artifact}))
registry.register(ToolDefinition("check_evidence_gaps", "Check Evidence Gaps", "Identifies missing telemetry without treating absence as proof of benign activity.", "verification", check_evidence_gaps_handler, {}))
