import os
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from backend.tools.registry import ToolDefinition, ToolExecutionResult, registry
from backend.tools.adapters.autopsy_adapter import autopsy_adapter
from backend.database.models import Artifact

def execute_autopsy(
    db: Session,
    case_id: str,
    module: str = "ingest",
    **kwargs
) -> ToolExecutionResult:
    """
    Executes Autopsy command-line automated ingest workflow against forensic disk artifacts.
    If Autopsy is not installed in the host OS or if raw disk images are absent, gracefully
    reports the diagnostic status and guides fallback to structured event parsers.
    """
    if not autopsy_adapter.is_available():
        return ToolExecutionResult(
            success=False,
            summary="Autopsy CLI executable ('autopsy' or 'autopsy64.exe') not found in PATH or AUTOPSY_PATH.",
            data={
                "tool": "autopsy",
                "installed": False,
                "graceful_fallback": "Active",
                "recommendation": "Use native structured endpoint telemetry parsers (EVTX, Sysmon, JSON/CSV).",
            },
            error="Autopsy CLI is not configured in the host environment. Set AUTOPSY_PATH to enable automated ingest.",
        )

    # Search for disk images in case artifacts
    disk_art = (
        db.query(Artifact)
        .filter(Artifact.case_id == case_id)
        .filter(Artifact.file_extension.in_([".dd", ".raw", ".img", ".e01"]))
        .first()
    )

    if not disk_art:
        return ToolExecutionResult(
            success=False,
            summary="Autopsy automated ingest workflow requires a raw disk image (.dd, .raw, .e01). None detected in this case.",
            data={
                "tool": "autopsy",
                "installed": True,
                "raw_image_present": False,
                "active_alternative": "Native Event & Sysmon Correlator",
            },
            error="No raw disk image artifact available for Autopsy DataSource ingest.",
        )

    case_dir = os.path.dirname(disk_art.storage_path)
    return autopsy_adapter.run_ingest(case_dir)

registry.register(
    ToolDefinition(
        name="autopsy",
        display_name="Autopsy Digital Forensics CLI",
        description="Coordinates automated ingest modules, data source processing, and artifact extraction using the Autopsy command-line ingest engine.",
        category="External Forensic Suite",
        handler=execute_autopsy,
        parameters_schema={
            "module": {"type": "string", "default": "ingest", "description": "Autopsy ingest module pipeline to trigger"},
        },
    )
)
