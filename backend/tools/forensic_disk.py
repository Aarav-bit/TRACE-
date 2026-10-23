"""Case-scoped, read-only Sleuth Kit actions registered for agent use."""
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from backend.config import EVIDENCE_WORK_DIR, MAX_EXTRACTION_SIZE_BYTES
from backend.database.models import Artifact
from backend.forensic.integrity import compute_sha256
from backend.tools.adapters.tsk_adapter import tsk_adapter
from backend.tools.registry import ToolDefinition, ToolExecutionResult, registry


def _image_for_case(db: Session, case_id: str, artifact_id: str) -> tuple[Optional[Artifact], Optional[Path], Optional[str]]:
    artifact = db.query(Artifact).filter(Artifact.id == artifact_id, Artifact.case_id == case_id).first()
    if not artifact:
        return None, None, "Artifact does not belong to this case."
    path = Path(artifact.original_storage_reference).resolve()
    case_root = Path(artifact.original_storage_reference).parent.resolve()
    if not path.is_file() or case_root not in path.parents:
        return None, None, "Artifact storage reference is invalid."
    return artifact, path, None


def _text_action(operation: str, db: Session, case_id: str, artifact_id: str, offset: Optional[int] = None, inode: Optional[int] = None, recursive: bool = False, **_: Any) -> ToolExecutionResult:
    _, image, error = _image_for_case(db, case_id, artifact_id)
    if error or image is None:
        return ToolExecutionResult(False, "Disk-image action rejected.", {}, error)
    args: List[str] = []
    if offset is not None:
        args.extend(["-o", str(offset)])
    if operation == "fls" and recursive:
        args.append("-r")
    trailing = [str(inode)] if inode is not None else []
    return tsk_adapter.execute(operation, image, args, trailing)


def mmls_handler(db: Session, case_id: str, artifact_id: str, **kwargs: Any) -> ToolExecutionResult:
    return _text_action("mmls", db, case_id, artifact_id, **kwargs)


def fsstat_handler(db: Session, case_id: str, artifact_id: str, offset: Optional[int] = None, **kwargs: Any) -> ToolExecutionResult:
    return _text_action("fsstat", db, case_id, artifact_id, offset=offset)


def fls_handler(db: Session, case_id: str, artifact_id: str, offset: Optional[int] = None, recursive: bool = False, **kwargs: Any) -> ToolExecutionResult:
    return _text_action("fls", db, case_id, artifact_id, offset=offset, recursive=recursive)


def istat_handler(db: Session, case_id: str, artifact_id: str, inode: int, offset: Optional[int] = None, **kwargs: Any) -> ToolExecutionResult:
    return _text_action("istat", db, case_id, artifact_id, offset=offset, inode=inode)


def icat_handler(
    db: Session,
    case_id: str,
    artifact_id: str,
    inode: int,
    confirmation: str,
    offset: Optional[int] = None,
    **kwargs: Any,
) -> ToolExecutionResult:
    if confirmation != "I_CONFIRM_RECOVERY":
        return ToolExecutionResult(False, "File recovery requires explicit confirmation.", {}, "Set confirmation to I_CONFIRM_RECOVERY after reviewing disk-space impact.")
    _, image, error = _image_for_case(db, case_id, artifact_id)
    if error or image is None:
        return ToolExecutionResult(False, "Disk-image recovery rejected.", {}, error)
    args = ["-o", str(offset)] if offset is not None else []
    result = tsk_adapter.execute("icat", image, args, [str(inode)], binary_output=True)
    if not result.success:
        return result
    content = result.data.pop("bytes")
    if len(content) > MAX_EXTRACTION_SIZE_BYTES:
        return ToolExecutionResult(False, "Recovered content exceeds the configured extraction limit.", {"size": len(content)}, "Extraction not written")
    output_dir = (EVIDENCE_WORK_DIR / case_id).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"recovered_{artifact_id}_{inode}.bin"
    output_path.write_bytes(content)
    result.data.update({"output_path": str(output_path), "size": len(content), "sha256": compute_sha256(output_path)})
    result.summary = "Forensic binary extraction completed into the designated case working directory."
    return result


COMMON_ARTIFACT = {"type": "string", "description": "Case-owned disk-image artifact UUID", "required": True}
OFFSET = {"type": "integer", "description": "Optional filesystem sector offset", "minimum": 0}
INODE = {"type": "integer", "description": "Filesystem metadata address", "required": True, "minimum": 0}

for name, title, description, handler, schema in [
    ("mmls", "List Disk Partitions", "Runs the configured mmls binary against a case-owned disk image.", mmls_handler, {"artifact_id": COMMON_ARTIFACT}),
    ("fsstat", "Inspect Filesystem", "Runs fsstat against a case-owned disk image and optional partition offset.", fsstat_handler, {"artifact_id": COMMON_ARTIFACT, "offset": OFFSET}),
    ("fls", "List Filesystem Entries", "Runs read-only fls against a case-owned disk image.", fls_handler, {"artifact_id": COMMON_ARTIFACT, "offset": OFFSET, "recursive": {"type": "boolean", "default": False}}),
    ("istat", "Inspect Metadata", "Runs istat for one inode from a case-owned disk image.", istat_handler, {"artifact_id": COMMON_ARTIFACT, "inode": INODE, "offset": OFFSET}),
    ("icat", "Recover File Bytes", "Recovers one inode only after explicit confirmation; writes only under the case work directory.", icat_handler, {"artifact_id": COMMON_ARTIFACT, "inode": INODE, "offset": OFFSET, "confirmation": {"type": "string", "required": True}}),
]:
    registry.register(ToolDefinition(name, title, description, "forensic_disk", handler, schema))
