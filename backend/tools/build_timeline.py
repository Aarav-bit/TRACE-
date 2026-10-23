from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from backend.database.models import EvidenceEvent
from backend.tools.registry import ToolExecutionResult, ToolDefinition, registry

def build_timeline_handler(
    db: Session,
    case_id: str,
    event_type: Optional[str] = None,
    user: Optional[str] = None,
    limit: int = 100,
    **kwargs
) -> ToolExecutionResult:
    query = (
        db.query(EvidenceEvent)
        .filter(EvidenceEvent.case_id == case_id)
        .order_by(EvidenceEvent.timestamp_utc.asc())
    )

    if event_type:
        query = query.filter(EvidenceEvent.event_type == event_type)

    all_events = query.limit(limit).all()

    timeline_items = []
    evidence_ids = []

    for ev in all_events:
        norm = ev.normalized_fields
        if user and user.lower() not in str(norm.get("user", "")).lower():
            continue

        evidence_ids.append(ev.id)
        timeline_items.append({
            "id": ev.id,
            "source_record_id": ev.source_record_id,
            "timestamp_utc": ev.timestamp_utc.isoformat(),
            "original_timestamp": ev.original_timestamp,
            "timezone_metadata": ev.timezone_metadata,
            "event_type": ev.event_type,
            "process_name": norm.get("process_name"),
            "pid": norm.get("pid"),
            "user": norm.get("user"),
            "summary": norm.get("command_line") or norm.get("file_path") or norm.get("description") or ev.event_type,
            "source_hash": ev.source_hash,
            "normalized_fields": norm,
        })

    summary = f"Built chronologically ordered incident timeline containing {len(timeline_items)} events (UTC normalized)."

    return ToolExecutionResult(
        success=True,
        summary=summary,
        data={"timeline": timeline_items, "total_events": len(timeline_items)},
        evidence_ids=evidence_ids,
    )

registry.register(
    ToolDefinition(
        name="build_timeline",
        display_name="Build Unified Incident Timeline",
        description="Constructs a unified, chronologically ordered event timeline with UTC normalization and preserved timezone provenance.",
        category="analysis",
        handler=build_timeline_handler,
        parameters_schema={
            "event_type": {"type": "string", "description": "Optional event type filter"},
            "user": {"type": "string", "description": "Optional user filter"},
            "limit": {"type": "integer", "description": "Maximum timeline events to return", "default": 100},
        },
    )
)
