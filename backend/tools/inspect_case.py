from typing import Any, Dict, List
from sqlalchemy.orm import Session
from backend.database.models import Case, Artifact, EvidenceEvent
from backend.tools.registry import ToolExecutionResult, ToolDefinition, registry

def inspect_case_handler(db: Session, case_id: str, **kwargs) -> ToolExecutionResult:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return ToolExecutionResult(
            success=False,
            summary=f"Case not found: {case_id}",
            data={},
            error=f"Case with ID '{case_id}' does not exist.",
        )

    artifacts = db.query(Artifact).filter(Artifact.case_id == case_id).all()
    events = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case_id).all()

    artifact_summaries = []
    for art in artifacts:
        artifact_summaries.append({
            "id": art.id,
            "filename": art.original_filename,
            "artifact_type": art.artifact_type,
            "file_size": art.file_size,
            "sha256": art.sha256,
            "parser_name": art.parser_name,
            "parser_status": art.parser_status,
            "record_count": art.record_count,
            "warnings": art.warnings,
        })

    # Gap and telemetry assessment
    event_types_present = set(ev.event_type for ev in events)
    known_gaps: List[str] = []

    if "process_creation" not in event_types_present:
        known_gaps.append("Missing process creation logs (EID 4688 / Sysmon EID 1)")
    if "user_logon" not in event_types_present:
        known_gaps.append("Missing authentication audit records (EID 4624)")
    if "network_connection" not in event_types_present:
        known_gaps.append("Missing network connection telemetry (Sysmon EID 3)")

    # Check for specific degraded telemetry indicators
    if case.is_demo and case.demo_type == "degraded":
        known_gaps.append("Degraded Telemetry Alert: Expected child process execution telemetry for suspicious payload is missing from ingested evidence.")

    summary = (
        f"Case '{case.name}' inspected. {len(artifacts)} artifact(s) ingested, "
        f"{len(events)} normalized forensic event(s) available across {len(event_types_present)} event categories. "
        f"{len(known_gaps)} evidentiary gap(s) identified."
    )

    data = {
        "case_id": case.id,
        "name": case.name,
        "objective": case.objective,
        "is_demo": case.is_demo,
        "demo_type": case.demo_type,
        "artifacts": artifact_summaries,
        "event_count": len(events),
        "event_types": list(event_types_present),
        "known_gaps": known_gaps,
    }

    return ToolExecutionResult(
        success=True,
        summary=summary,
        data=data,
        evidence_ids=[ev.id for ev in events[:5]],
    )

registry.register(
    ToolDefinition(
        name="inspect_case",
        display_name="Inspect Case Manifest",
        description="Reads case metadata, ingested artifact hashes, parser health, and identifies preliminary evidentiary gaps.",
        category="reconnaissance",
        handler=inspect_case_handler,
        parameters_schema={},
    )
)
