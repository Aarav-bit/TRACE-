import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.config import STORAGE_DIR, MAX_UPLOAD_SIZE_BYTES, BASE_DIR
from backend.database.models import Case, Artifact, EvidenceEvent
from backend.database.schemas import ArtifactResponse
from backend.database.session import get_db
from backend.forensic.integrity import compute_sha256, make_file_readonly, add_audit_entry
from backend.forensic.parsers.json_csv_parser import parse_json_file, parse_csv_file
from backend.forensic.parsers.evtx_parser import parse_evtx_file
from backend.forensic.parsers.zip_parser import safe_extract_zip

router = APIRouter(prefix="/api/cases/{case_id}/artifacts", tags=["artifacts"])

sample_router = APIRouter(prefix="/api/sample-evidence", tags=["sample-evidence"])

@sample_router.get("/download")
def download_sample_evidence_bundle():
    zip_path = BASE_DIR / "data" / "sample_evidence" / "incident_triage_bundle.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Sample evidence bundle not found on disk")
    return FileResponse(
        path=str(zip_path),
        filename="incident_triage_bundle.zip",
        media_type="application/zip",
    )

@router.get("", response_model=List[ArtifactResponse])
def list_artifacts(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    artifacts = db.query(Artifact).filter(Artifact.case_id == case_id).all()
    return artifacts

@router.post("", response_model=List[ArtifactResponse])
async def upload_artifacts(
    case_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case_storage = STORAGE_DIR / case_id
    case_storage.mkdir(parents=True, exist_ok=True)

    created_artifacts = []

    for upload_file in files:
        filename = Path(upload_file.filename or "unknown").name
        dest_path = case_storage / filename

        # Stream upload with size check
        size = 0
        with open(dest_path, "wb") as buffer:
            while chunk := await upload_file.read(65536):
                size += len(chunk)
                if size > MAX_UPLOAD_SIZE_BYTES:
                    buffer.close()
                    dest_path.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail=f"File '{filename}' exceeds {MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB limit.")
                buffer.write(chunk)

        # Hash immediately before parsing
        sha256 = compute_sha256(dest_path)
        make_file_readonly(dest_path)

        ext = dest_path.suffix.lower()
        parser_name = "unknown_parser"
        parser_status = "parsed"
        warnings = []
        parsed_records = []

        # Handle ZIP Archives
        if ext == ".zip":
            parser_name = "zip_bundle_extractor"
            extract_dir = case_storage / f"extracted_{dest_path.stem}"
            extracted_files, zip_warns = safe_extract_zip(dest_path, extract_dir)
            warnings.extend(zip_warns)

            for ext_file in extracted_files:
                sub_ext = ext_file.suffix.lower()
                if sub_ext in [".json", ".jsonl"]:
                    recs, w = parse_json_file(ext_file)
                    parsed_records.extend(recs)
                    warnings.extend(w)
                elif sub_ext == ".csv":
                    recs, w = parse_csv_file(ext_file)
                    parsed_records.extend(recs)
                    warnings.extend(w)
                elif sub_ext == ".evtx":
                    recs, w = parse_evtx_file(ext_file)
                    parsed_records.extend(recs)
                    warnings.extend(w)

        elif ext in [".json", ".jsonl"]:
            parser_name = "json_endpoint_parser"
            parsed_records, warnings = parse_json_file(dest_path)
        elif ext == ".csv":
            parser_name = "csv_endpoint_parser"
            parsed_records, warnings = parse_csv_file(dest_path)
        elif ext == ".evtx":
            parser_name = "evtx_binary_parser"
            parsed_records, warnings = parse_evtx_file(dest_path)
        else:
            parser_name = "generic_binary_storer"
            parser_status = "parsed_with_warnings"
            warnings.append(f"No specialized structured parser for extension '{ext}'. Preserved as raw forensic evidence.")

        if warnings and parser_status != "failed":
            parser_status = "parsed_with_warnings"

        artifact = Artifact(
            case_id=case.id,
            original_filename=filename,
            artifact_type=ext.replace(".", "") or "binary",
            file_size=size,
            sha256=sha256,
            original_storage_reference=str(dest_path),
            parser_name=parser_name,
            parser_status=parser_status,
            record_count=len(parsed_records),
            warnings="; ".join(warnings) if warnings else None,
        )
        db.add(artifact)
        db.flush()

        # Ingest parsed records into EvidenceEvents
        for rec in parsed_records:
            ev = EvidenceEvent(
                case_id=case.id,
                artifact_id=artifact.id,
                source_record_id=rec["source_record_id"],
                timestamp_utc=rec["timestamp_utc"],
                original_timestamp=rec["original_timestamp"],
                timezone_metadata=rec["timezone_metadata"],
                event_type=rec["event_type"],
                normalized_fields=rec["normalized_fields"],
                source_hash=rec["source_hash"],
            )
            db.add(ev)

        add_audit_entry(
            db,
            case_id=case.id,
            event_type="ARTIFACT_UPLOADED",
            event_data={
                "filename": filename,
                "sha256": sha256,
                "file_size": size,
                "records_extracted": len(parsed_records),
            },
        )

        db.commit()
        db.refresh(artifact)
        created_artifacts.append(artifact)

    return created_artifacts
