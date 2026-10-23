from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from backend.database.models import EvidenceEvent
from backend.tools.registry import ToolExecutionResult, ToolDefinition, registry

def query_events_handler(
    db: Session,
    case_id: str,
    event_type: Optional[str] = None,
    user: Optional[str] = None,
    process_name: Optional[str] = None,
    pid: Optional[str] = None,
    search_term: Optional[str] = None,
    limit: int = 50,
    **kwargs
) -> ToolExecutionResult:
    query = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case_id)

    if event_type:
        query = query.filter(EvidenceEvent.event_type.ilike(f"%{event_type}%"))

    events = query.order_by(EvidenceEvent.timestamp_utc.asc()).all()

    # Filter in memory for JSON normalized fields
    filtered_events = []
    for ev in events:
        norm = ev.normalized_fields
        if user and user.lower() not in str(norm.get("user", "")).lower():
            continue
        if process_name and process_name.lower() not in str(norm.get("process_name", "")).lower():
            continue
        if pid and str(pid) != str(norm.get("pid", "")):
            continue
        if search_term:
            term = search_term.lower()
            str_repr = f"{ev.event_type} {norm.get('command_line', '')} {norm.get('file_path', '')} {norm.get('process_name', '')} {norm.get('description', '')}".lower()
            if term not in str_repr:
                continue

        filtered_events.append(ev)
        if len(filtered_events) >= limit:
            break

    evidence_ids = [ev.id for ev in filtered_events]
    results_list = []
    for ev in filtered_events:
        results_list.append({
            "id": ev.id,
            "source_record_id": ev.source_record_id,
            "timestamp_utc": ev.timestamp_utc.isoformat(),
            "original_timestamp": ev.original_timestamp,
            "event_type": ev.event_type,
            "normalized_fields": ev.normalized_fields,
            "source_hash": ev.source_hash,
        })

    summary = (
        f"Query returned {len(results_list)} forensic event(s) matching criteria "
        f"[type={event_type or '*'}, user={user or '*'}, process={process_name or '*'}, term={search_term or '*'}]"
    )

    return ToolExecutionResult(
        success=True,
        summary=summary,
        data={"events": results_list, "total_matched": len(results_list)},
        evidence_ids=evidence_ids,
    )

registry.register(
    ToolDefinition(
        name="query_events",
        display_name="Query Forensic Events",
        description="Filters and searches normalized forensic events by event type, user, process name, PID, or keyword search.",
        category="query",
        handler=query_events_handler,
        parameters_schema={
            "event_type": {"type": "string", "description": "Filter by event type (e.g. process_creation, user_logon)"},
            "user": {"type": "string", "description": "Filter by username"},
            "process_name": {"type": "string", "description": "Filter by executable filename"},
            "pid": {"type": "string", "description": "Filter by Process ID"},
            "search_term": {"type": "string", "description": "Keyword search across command line and paths"},
            "limit": {"type": "integer", "description": "Maximum records to return", "default": 50},
        },
    )
)
