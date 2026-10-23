import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple
from dateutil import parser as date_parser
from backend.forensic.integrity import compute_record_hash

# Common Living-off-the-Land Binaries (LOLBins) and suspicious utilities
LOLBINS = {
    "powershell.exe", "cmd.exe", "wscript.exe", "cscript.exe", "mshta.exe",
    "rundll32.exe", "regsvr32.exe", "certutil.exe", "bitsadmin.exe", "vssadmin.exe",
    "wmic.exe", "psexec.exe", "nltest.exe", "whoami.exe", "net.exe", "net1.exe",
    "schtasks.exe", "tasklist.exe", "at.exe", "reg.exe", "sc.exe", "curl.exe", "wget.exe"
}

# Suspicious command line patterns
SUSPICIOUS_CMD_PATTERNS = [
    r"-enc\b", r"-encodedcommand\b", r"bypass\b", r"downloadstring", r"downloadfile",
    r"invoke-webrequest", r"invoke-expression", r"\biex\b", r"http://", r"https://",
    r"hidden\b", r"delete shadows", r"resize shadowstorage", r"mimikatz", r"sekurlsa",
    r"procdump", r"ntdsutil", r"lsass", r"frombase64string", r"wscript\.shell"
]

def normalize_timestamp(raw_val: Any) -> Tuple[datetime, str, str]:
    """
    Normalizes a timestamp string, float, or int to UTC datetime, original string, and tz metadata.
    """
    raw_str = str(raw_val).strip() if raw_val is not None else ""
    if not raw_str:
        now = datetime.now(timezone.utc)
        return now, now.isoformat(), "UTC"

    try:
        # Check if Unix epoch timestamp
        cleaned = raw_str.replace(".", "", 1)
        if cleaned.isdigit() and len(cleaned) >= 10:
            ts_float = float(raw_str)
            if ts_float > 1e11:  # milliseconds
                ts_float /= 1000.0
            dt = datetime.fromtimestamp(ts_float, tz=timezone.utc)
            return dt, raw_str, "UTC"

        parsed = date_parser.parse(raw_str)
        if parsed.tzinfo is None:
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
    explicit = str(rec.get("event_type") or rec.get("EventType") or rec.get("Channel") or "").lower()
    eid = str(rec.get("event_id") or rec.get("EventID") or rec.get("id") or rec.get("EventId") or "")

    if eid in ["4688", "1"] or "process" in explicit or "creation" in explicit:
        return "process_creation"
    if eid in ["4624", "4625", "4672", "4648"] or "logon" in explicit or "auth" in explicit:
        return "user_logon"
    if eid in ["11", "15", "4663"] or "file" in explicit:
        return "file_activity"
    if eid in ["3", "5156", "5158"] or "network" in explicit or "connection" in explicit:
        return "network_connection"
    if eid in ["4104", "4103", "400"] or "powershell" in explicit:
        return "powershell_execution"
    if eid in ["13", "12", "14", "4657"] or "registry" in explicit:
        return "registry_modification"
    if eid in ["7045", "4697"] or "service" in explicit:
        return "service_installation"
    if eid in ["4698", "106"] or "task" in explicit or "schtask" in explicit:
        return "scheduled_task"
    if eid in ["1102", "104"]:
        return "log_cleared"

    return explicit if explicit else "system_telemetry"

def extract_mitre_tactics(proc_name: str, cmd_line: str, event_type: str) -> List[str]:
    """Maps forensic artifacts to MITRE ATT&CK techniques."""
    mitre_tags = []
    cmd_lower = (cmd_line or "").lower()
    proc_lower = (proc_name or "").lower()

    if "powershell" in proc_lower or "pwsh" in proc_lower:
        mitre_tags.append("T1059.001 (Command and Scripting: PowerShell)")
    elif "cmd.exe" in proc_lower:
        mitre_tags.append("T1059.003 (Command and Scripting: Windows Command Shell)")
    elif "mshta.exe" in proc_lower:
        mitre_tags.append("T1218.005 (Signed Binary Proxy: Mshta)")
    elif "rundll32.exe" in proc_lower:
        mitre_tags.append("T1218.011 (Signed Binary Proxy: Rundll32)")

    if any(re.search(p, cmd_lower) for p in [r"-enc\b", r"-encodedcommand\b", r"frombase64string"]):
        mitre_tags.append("T1027 (Obfuscated/Encoded Commands)")

    if any(p in cmd_lower for p in ["downloadstring", "invoke-webrequest", "curl", "wget", "bitsadmin", "certutil"]):
        mitre_tags.append("T1105 (Ingress Tool Transfer)")

    if event_type == "registry_modification" and "run" in cmd_lower:
        mitre_tags.append("T1547.001 (Boot or Logon Autostart: Registry Run Keys)")

    if event_type == "scheduled_task" or "schtasks" in cmd_lower:
        mitre_tags.append("T1053 (Scheduled Task/Job)")

    if event_type == "log_cleared":
        mitre_tags.append("T1070 (Indicator Removal on Host: Clear Event Logs)")

    return mitre_tags

def normalize_event_record(raw: Dict[str, Any], record_idx: int) -> Dict[str, Any]:
    """Extracts and standardizes key forensic properties across diverse DFIR schemas."""
    # Find timestamp
    raw_ts = (
        raw.get("timestamp")
        or raw.get("TimeCreated")
        or raw.get("timestamp_utc")
        or raw.get("DateTime")
        or raw.get("UtcTime")
        or raw.get("@timestamp")
        or raw.get("EventTime")
    )
    ts_utc, orig_ts, tz_meta = normalize_timestamp(raw_ts)
    event_type = detect_event_type(raw)

    # Process name
    process_name = (
        raw.get("process_name")
        or raw.get("Image")
        or raw.get("NewProcessName")
        or raw.get("ProcessName")
        or raw.get("process")
        or raw.get("FileName")
        or raw.get("CommandLine_Image")
    )
    if process_name and ("\\" in str(process_name) or "/" in str(process_name)):
        process_name = Path(str(process_name)).name

    # PIDs
    pid = raw.get("pid") or raw.get("ProcessId") or raw.get("NewProcessId") or raw.get("PID")
    ppid = raw.get("ppid") or raw.get("ParentProcessId") or raw.get("PPID")
    parent_process = (
        raw.get("parent_process_name")
        or raw.get("ParentImage")
        or raw.get("ParentProcessName")
        or raw.get("parent_process")
    )
    if parent_process and ("\\" in str(parent_process) or "/" in str(parent_process)):
        parent_process = Path(str(parent_process)).name

    # Command line
    command_line = (
        raw.get("command_line")
        or raw.get("CommandLine")
        or raw.get("ScriptBlockText")
        or raw.get("cmd")
        or raw.get("ProcessCommandLine")
        or raw.get("Command")
    )

    # User
    user = (
        raw.get("user")
        or raw.get("User")
        or raw.get("SubjectUserName")
        or raw.get("TargetUserName")
        or raw.get("account")
        or raw.get("UserName")
        or raw.get("AccountName")
    )

    # File path
    file_path = (
        raw.get("file_path")
        or raw.get("TargetFilename")
        or raw.get("FilePath")
        or raw.get("target_file")
        or raw.get("TargetObject")
        or raw.get("Path")
    )

    # Network
    source_ip = raw.get("source_ip") or raw.get("SourceIp") or raw.get("IpAddress") or raw.get("SrcIP")
    dest_ip = raw.get("dest_ip") or raw.get("DestinationIp") or raw.get("DestIP")
    dest_port = raw.get("dest_port") or raw.get("DestinationPort") or raw.get("DestPort")

    # Hashes & Threat Tags
    hashes = raw.get("Hashes") or raw.get("hashes") or raw.get("sha256") or raw.get("md5") or ""
    mitre_tags = extract_mitre_tactics(process_name or "", command_line or "", event_type)

    # Compute Threat Indicators
    is_lolbin = str(process_name).lower() in LOLBINS if process_name else False
    has_suspicious_cmd = any(re.search(p, str(command_line).lower()) for p in SUSPICIOUS_CMD_PATTERNS) if command_line else False
    suspicious_path = any(p in str(file_path or command_line).lower() for p in ["\\temp\\", "\\appdata\\", "\\users\\public\\", "\\windows\\cache\\", "\\perflogs\\"])

    threat_score = 0
    if is_lolbin: threat_score += 20
    if has_suspicious_cmd: threat_score += 45
    if suspicious_path: threat_score += 25
    if mitre_tags: threat_score += 20

    normalized = {
        "event_id": str(raw.get("event_id") or raw.get("EventID") or ""),
        "process_name": process_name,
        "pid": str(pid) if pid is not None else None,
        "parent_process_name": parent_process,
        "ppid": str(ppid) if ppid is not None else None,
        "command_line": command_line,
        "user": user,
        "file_path": file_path,
        "source_ip": source_ip,
        "dest_ip": dest_ip,
        "dest_port": str(dest_port) if dest_port else None,
        "hashes": hashes,
        "mitre_tags": mitre_tags,
        "threat_score": min(threat_score, 100),
        "is_lolbin": is_lolbin,
        "raw_attributes": raw,
    }

    source_rec_id = str(raw.get("record_id") or raw.get("RecordNumber") or raw.get("EventRecordID") or f"REC-{record_idx:05d}")
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

            try:
                data = json.loads(content)
                if isinstance(data, list):
                    raw_list = data
                elif isinstance(data, dict):
                    if "events" in data and isinstance(data["events"], list):
                        raw_list = data["events"]
                    elif "records" in data and isinstance(data["records"], list):
                        raw_list = data["records"]
                    else:
                        raw_list = [data]
                else:
                    return [], ["JSON root is neither list nor object"]
            except json.JSONDecodeError:
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
