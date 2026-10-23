import os
import shutil
from typing import Optional
from backend.tools.registry import ToolExecutionResult

class AutopsyAdapter:
    def __init__(self):
        # Look for autopsy executable or autopsy64.exe
        self.autopsy_path = shutil.which("autopsy") or shutil.which("autopsy64") or os.getenv("AUTOPSY_PATH")

    def is_available(self) -> bool:
        return self.autopsy_path is not None and os.path.exists(str(self.autopsy_path))

    def get_version(self) -> Optional[str]:
        if not self.is_available():
            return None
        return "Autopsy Command-Line Ingest Workflow (Configured)"

    def run_ingest(self, case_dir: str) -> ToolExecutionResult:
        if not self.is_available():
            return ToolExecutionResult(
                success=False,
                summary="Autopsy executable is not configured or installed.",
                data={"installed": False},
                error="Autopsy CLI is not available in PATH. Set AUTOPSY_PATH environment variable to enable.",
            )
        return ToolExecutionResult(
            success=False,
            summary="Autopsy CLI ingest requires an uncompressed raw disk image source.",
            data={},
            error="No raw E01/DD disk image artifact uploaded in this case.",
        )

autopsy_adapter = AutopsyAdapter()
