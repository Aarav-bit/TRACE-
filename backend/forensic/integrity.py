import hashlib
import json
import os
import stat
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict
from sqlalchemy.orm import Session
from backend.database.models import AuditEntry, get_utc_now

def compute_sha256(file_path: Path) -> str:
    """Computes SHA-256 hash of a file streaming in chunks."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def compute_bytes_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def compute_record_hash(record_dict: Dict[str, Any]) -> str:
    """Stable JSON hash of normalized fields."""
    serialized = json.dumps(record_dict, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def make_file_readonly(file_path: Path):
    """Marks a stored artifact read-only on disk to guarantee original evidence preservation."""
    try:
        current_mode = os.stat(file_path).st_mode
        os.chmod(file_path, current_mode & ~stat.S_IWRITE)
    except Exception:
        pass

def ensure_file_writable(file_path: Path):
    """Restores write permission if file exists and was marked read-only."""
    try:
        if file_path.exists():
            current_mode = os.stat(file_path).st_mode
            os.chmod(file_path, current_mode | stat.S_IWRITE)
    except Exception:
        pass

def add_audit_entry(
    db: Session,
    case_id: str,
    event_type: str,
    event_data: Dict[str, Any]
) -> AuditEntry:
    """
    Appends an entry to the audit log for a case with cryptographic hash chaining.
    entry_hash = SHA256(previous_hash + sequence_number + event_type + JSON(event_data) + timestamp)
    """
    last_entry = (
        db.query(AuditEntry)
        .filter(AuditEntry.case_id == case_id)
        .order_by(AuditEntry.sequence_number.desc())
        .first()
    )

    if last_entry:
        sequence_number = last_entry.sequence_number + 1
        previous_hash = last_entry.entry_hash
    else:
        sequence_number = 1
        previous_hash = "0" * 64

    timestamp = get_utc_now().isoformat()
    raw_payload = f"{previous_hash}:{sequence_number}:{event_type}:{json.dumps(event_data, sort_keys=True)}:{timestamp}"
    entry_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

    audit_entry = AuditEntry(
        case_id=case_id,
        sequence_number=sequence_number,
        event_type=event_type,
        event_data_json=json.dumps(event_data),
        previous_hash=previous_hash,
        entry_hash=entry_hash,
    )
    db.add(audit_entry)
    db.flush()
    return audit_entry
