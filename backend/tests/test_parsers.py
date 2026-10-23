import json
import zipfile
from pathlib import Path
from backend.forensic.parsers.json_csv_parser import normalize_timestamp, parse_json_file, parse_csv_file
from backend.forensic.parsers.zip_parser import safe_extract_zip

def test_normalize_timestamp():
    dt, orig, tz_meta = normalize_timestamp("2026-10-23T10:05:30Z")
    assert dt.year == 2026
    assert dt.hour == 10
    assert dt.minute == 5

    dt2, orig2, tz2 = normalize_timestamp("2026-10-23 15:30:00")
    assert dt2 is not None

def test_parse_json_file(tmp_path: Path):
    json_file = tmp_path / "test_events.json"
    data = [
        {
            "record_id": "TEST-01",
            "timestamp": "2026-10-23T12:00:00Z",
            "event_id": "4688",
            "process_name": "cmd.exe",
            "pid": "1000",
            "parent_process_name": "explorer.exe",
            "ppid": "500",
            "command_line": "cmd.exe /c whoami",
            "user": "TEST_USER",
        }
    ]
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(data, f)

    records, warnings = parse_json_file(json_file)
    assert len(records) == 1
    assert records[0]["source_record_id"] == "TEST-01"
    assert records[0]["event_type"] == "process_creation"
    assert records[0]["normalized_fields"]["process_name"] == "cmd.exe"
    assert records[0]["normalized_fields"]["pid"] == "1000"

def test_zip_slip_protection(tmp_path: Path):
    zip_path = tmp_path / "malicious.zip"
    extract_dir = tmp_path / "extracted"

    # Create a zip containing a path traversal entry
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("../../../evil.txt", "malicious payload")
        zf.writestr("legit.txt", "safe data")

    extracted, warnings = safe_extract_zip(zip_path, extract_dir)

    # Malicious path should be skipped and reported in warnings
    assert len(extracted) == 1
    assert extracted[0].name == "legit.txt"
    assert any("Blocked path traversal" in w for w in warnings)
    assert not (tmp_path.parent / "evil.txt").exists()
