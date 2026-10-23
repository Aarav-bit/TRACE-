import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple
from dateutil import parser as date_parser
from backend.forensic.integrity import compute_record_hash

def normalize_timestamp(raw_val: Any) -> Tuple[datetime, str, str]:
    """
    Normalizes a timestamp string or integer to UTC datetime, original string, and tz metadata.
    """
    raw_str = str(raw_val).strip()
    if not raw_str:
        now = datetime.now(timezone.utc)
        return now, now.isoformat(), "UTC"

    try:
        # Check if Unix epoch timestamp
        if raw_str.replace(".", "", 1).isdigit() and len(raw_str) >= 10:
            ts_float = float(raw_str)
            dt = datetime.fromtimestamp(ts_float, tz=timezone.utc)
            return dt, raw_str, "UTC"

        parsed = date_parser.parse(raw_str)
        if parsed.tzinfo is None:
            # Assume UTC if naive, but record metadata as naive converted to UTC
            dt_utc = parsed.replace(tzinfo=timezone.utc)
            tz_meta = "Naive (Assumed UTC)"
        else:
            dt_utc = parsed.astimezone(timezone.utc)
            tz_meta = str(parsed.tzinfo)
        return dt_utc, raw_str, tz_meta
    except Exception:
        now = datetime.now(timezone.utc)
        return now, raw_str, "Unparseable (Fallback UTC)"

def detect_event_type(rec: Dict[str, Any]) -> str:
    """Classifies log entry into standard forensic event taxonomy."""
    # Check explicit fields
    explicit = rec.get("event_type") or rec.get("EventType") or rec.get("Channel")
    eid = str(rec.get("event_id") or rec.get("EventID") or rec.get("id") or "")

    if eid in ["4688", "1"] or "process" in str(explicit).lower():
        return "process_creation"
    if eid in ["4624", "4625"] or "logon" in str(explicit).lower():
        return "user_logon"
    if eid in ["11", "15"] or "file" in str(explicit).lower():
        return "file_activity"
    if eid in ["3"] or "network" in str(explicit).lower():
        return "network_connection"
    if eid in ["4104", "4103"] or "powershell" in str(explicit).lower():
        return "powershell_execution"
    if eid in ["13", "12"] or "registry" in str(explicit).lower():
        return "registry_modification"

    return explicit if explicit else "system_telemetry"

def normalize_event_record(raw: Dict[str, Any], record_idx: int) -> Dict[str, Any]:
    """Extracts and standardizes key forensic properties."""
    raw_ts = (
        raw.get("timestamp")
        or raw.get("TimeCreated")
        or raw.get("timestamp_utc")
        or raw.get("DateTime")
        or raw.get("UtcTime")
    )
    ts_utc, orig_ts, tz_meta = normalize_timestamp(raw_ts)
    event_type = detect_event_type(raw)

    # Standardize common fields
    process_name = (
        raw.get("process_name")
        or raw.get("Image")
        or raw.get("NewProcessName")
        or raw.get("ProcessName")
        or raw.get("process")
    )
    if process_name and ("\\" in str(process_name) or "/" in str(process_name)):
        process_name = Path(process_name).name

    pid = raw.get("pid") or raw.get("ProcessId") or raw.get("NewProcessId")
    ppid = raw.get("ppid") or raw.get("ParentProcessId")
    parent_process = (
        raw.get("parent_process_name")
        or raw.get("ParentImage")
        or raw.get("ParentProcessName")
    )
    if parent_process and ("\\" in str(parent_process) or "/" in str(parent_process)):
        parent_process = Path(parent_process).name

    command_line = (
        raw.get("command_line")
        or raw.get("CommandLine")
        or raw.get("ScriptBlockText")
        or raw.get("cmd")
    )
    user = (
        raw.get("user")
        or raw.get("User")
        or raw.get("SubjectUserName")
        or raw.get("TargetUserName")
        or raw.get("account")
    )
    file_path = (
        raw.get("file_path")
        or raw.get("TargetFilename")
        or raw.get("FilePath")
        or raw.get("target_file")
    )
    source_ip = raw.get("source_ip") or raw.get("SourceIp") or raw.get("IpAddress")
    dest_ip = raw.get("dest_ip") or raw.get("DestinationIp")
    dest_port = raw.get("dest_port") or raw.get("DestinationPort")

    normalized = {
        "event_id": raw.get("event_id") or raw.get("EventID") or "",
        "process_name": process_name,
        "pid": str(pid) if pid is not None else None,
        "parent_process_name": parent_process,
        "ppid": str(ppid) if ppid is not None else None,
        "command_line": command_line,
        "user": user,
        "file_path": file_path,
        "source_ip": source_ip,
        "dest_ip": dest_ip,
        "dest_port": dest_port,
        "raw_attributes": raw,
    }

    source_rec_id = str(raw.get("record_id") or raw.get("RecordNumber") or f"REC-{record_idx:05d}")
    src_hash = compute_record_hash(normalized)

    return {
        "source_record_id": source_rec_id,
        "timestamp_utc": ts_utc,
        "original_timestamp": orig_ts,
        "timezone_metadata": tz_meta,
        "event_type": event_type,
        "normalized_fields": normalized,
        "source_hash": src_hash,
    }

def parse_json_file(file_path: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    warnings = []
    records = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
            if not content:
                return [], ["File is empty"]

            # Try parsing JSON array or JSON-lines
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    raw_list = data
                elif isinstance(data, dict):
                    # Check if wrapped in "events" or "records"
                    if "events" in data and isinstance(data["events"], list):
                        raw_list = data["events"]
                    elif "records" in data and isinstance(data["records"], list):
                        raw_list = data["records"]
                    else:
                        raw_list = [data]
                else:
                    return [], ["JSON root is neither list nor object"]
            except json.JSONDecodeError:
                # Try parsing line by line
                raw_list = []
                for idx, line in enumerate(content.splitlines(), start=1):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        raw_list.append(json.loads(line))
                    except Exception as le:
                        warnings.append(f"Line {idx} invalid JSON: {le}")

        for idx, item in enumerate(raw_list, start=1):
            if isinstance(item, dict):
                records.append(normalize_event_record(item, idx))

    except Exception as e:
        warnings.append(f"Parser error: {str(e)}")

    return records, warnings

def parse_csv_file(file_path: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    warnings = []
    records = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                return [], ["Empty CSV file or no headers found"]

            for idx, row in enumerate(reader, start=1):
                clean_row = {k.strip(): v.strip() for k, v in row.items() if k}
                records.append(normalize_event_record(clean_row, idx))

    except Exception as e:
        warnings.append(f"CSV parse error: {str(e)}")

    return records, warnings
