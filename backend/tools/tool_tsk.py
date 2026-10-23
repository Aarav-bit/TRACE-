from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from backend.tools.registry import ToolDefinition, ToolExecutionResult, registry
from backend.tools.adapters.tsk_adapter import tsk_adapter
from backend.database.models import Artifact

def execute_the_sleuth_kit(
    db: Session,
    case_id: str,
    subtool: str = "fls",
    target_image: Optional[str] = None,
    **kwargs
) -> ToolExecutionResult:
    """
    Executes The Sleuth Kit (TSK) command-line utility (e.g., fls, istat) against raw disk images.
    If TSK is not installed in the host OS or if raw disk images are absent, gracefully
    reports the diagnostic status and guides fallback to structured event parsers.
    """
    if not tsk_adapter.is_available():
        return ToolExecutionResult(
            success=False,
            summary="The Sleuth Kit (TSK) CLI binaries ('fls', 'istat', 'mactime') are not found on system PATH.",
            data={
                "tool": "the_sleuth_kit",
                "installed": False,
                "graceful_fallback": "Active",
                "recommendation": "Use native structured endpoint telemetry parsers (EVTX, Sysmon, JSON/CSV).",
            },
            error="TSK CLI binary 'fls' is not installed in the local environment PATH.",
        )

    # Search for disk images in case artifacts
    disk_art = (
        db.query(Artifact)
        .filter(Artifact.case_id == case_id)
        .filter(Artifact.file_extension.in_([".dd", ".raw", ".img", ".e01"]))
        .first()
    )

    image_path = target_image or (disk_art.storage_path if disk_art else None)
    if not image_path:
        return ToolExecutionResult(
            success=False,
            summary="The Sleuth Kit requires a raw filesystem or disk image (.dd, .raw, .e01). None detected in this case.",
            data={
                "tool": "the_sleuth_kit",
                "installed": True,
                "raw_image_present": False,
                "active_alternative": "Native Event & Sysmon Correlator",
            },
            error="No raw disk image artifact available for TSK partition traversal.",
        )

    return tsk_adapter.list_files(image_path)

registry.register(
    ToolDefinition(
        name="the_sleuth_kit",
        display_name="The Sleuth Kit (TSK CLI)",
        description="Executes The Sleuth Kit command-line utilities (fls, istat, mactime) to parse raw disk images, extract inode metadata, and construct filesystem timelines.",
        category="Disk Forensics",
        handler=execute_the_sleuth_kit,
        parameters_schema={
            "subtool": {"type": "string", "default": "fls", "description": "TSK binary to execute: 'fls', 'istat', or 'mactime'"},
            "target_image": {"type": "string", "description": "Path to raw disk image (.dd, .raw, .e01)"},
        },
    )
)
