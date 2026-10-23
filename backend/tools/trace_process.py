from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from backend.database.models import EvidenceEvent
from backend.tools.registry import ToolExecutionResult, ToolDefinition, registry

def trace_process_handler(
    db: Session,
    case_id: str,
    root_process: Optional[str] = None,
    target_pid: Optional[str] = None,
    **kwargs
) -> ToolExecutionResult:
    events = (
        db.query(EvidenceEvent)
        .filter(EvidenceEvent.case_id == case_id)
        .order_by(EvidenceEvent.timestamp_utc.asc())
        .all()
    )

    process_events = [ev for ev in events if ev.event_type == "process_creation"]
    other_events = [ev for ev in events if ev.event_type != "process_creation"]

    # Map processes by PID
    processes_by_pid: Dict[str, Dict[str, Any]] = {}
    evidence_ids: List[str] = []

    for ev in process_events:
        norm = ev.normalized_fields
        pid = str(norm.get("pid") or "")
        ppid = str(norm.get("ppid") or "")
        name = norm.get("process_name") or "unknown"
        parent_name = norm.get("parent_process_name") or "unknown"
        cmd = norm.get("command_line") or ""
        user = norm.get("user") or ""

        if pid:
            evidence_ids.append(ev.id)
            processes_by_pid[pid] = {
                "pid": pid,
                "ppid": ppid,
                "name": name,
                "parent_name": parent_name,
                "command_line": cmd,
                "user": user,
                "timestamp_utc": ev.timestamp_utc.isoformat(),
                "evidence_id": ev.id,
                "source_record_id": ev.source_record_id,
                "children": [],
                "relationship_class": "observed",  # explicit 4688 record
            }

    # Build hierarchy
    root_nodes = []
    missing_parents = []

    for pid, proc in processes_by_pid.items():
        ppid = proc["ppid"]
        if ppid and ppid in processes_by_pid:
            processes_by_pid[ppid]["children"].append(proc)
        else:
            if ppid:
                proc["relationship_class"] = "missing_parent_record"
                missing_parents.append({
                    "child_pid": pid,
                    "child_name": proc["name"],
                    "missing_parent_pid": ppid,
                    "missing_parent_name": proc["parent_name"],
                })
            root_nodes.append(proc)

    # Check for execution evidence outside process_creation records (e.g. network connection or file activity for a PID without 4688)
    unanchored_executions = []
    observed_pids = set(processes_by_pid.keys())
    for ev in other_events:
        norm = ev.normalized_fields
        ev_pid = str(norm.get("pid") or "")
        ev_proc = norm.get("process_name")
        if ev_pid and ev_pid not in observed_pids and ev_proc:
            if not any(u["pid"] == ev_pid for u in unanchored_executions):
                evidence_ids.append(ev.id)
                unanchored_executions.append({
                    "pid": ev_pid,
                    "name": ev_proc,
                    "relationship_class": "inferred_from_telemetry",
                    "reason": f"Active process observed in {ev.event_type} (source {ev.source_record_id}) but missing creation record (EID 4688).",
                    "evidence_id": ev.id,
                    "source_record_id": ev.source_record_id,
                })

    summary = (
        f"Process lineage traced: {len(processes_by_pid)} observed process execution(s), "
        f"{len(missing_parents)} process(es) with unobserved parent records, "
        f"{len(unanchored_executions)} unanchored execution(s) identified from peripheral telemetry."
    )

    data = {
        "process_tree": root_nodes,
        "all_processes": list(processes_by_pid.values()),
        "missing_parents": missing_parents,
        "unanchored_executions": unanchored_executions,
        "total_observed": len(processes_by_pid),
    }

    return ToolExecutionResult(
        success=True,
        summary=summary,
        data=data,
        evidence_ids=evidence_ids,
    )

registry.register(
    ToolDefinition(
        name="trace_process",
        display_name="Trace Process Lineage",
        description="Reconstructs process ancestry trees from PIDs and PPIDs, distinguishing observed from inferred relationships and identifying missing parent telemetry.",
        category="analysis",
        handler=trace_process_handler,
        parameters_schema={
            "root_process": {"type": "string", "description": "Optional root process name"},
            "target_pid": {"type": "string", "description": "Specific PID to inspect"},
        },
    )
)
