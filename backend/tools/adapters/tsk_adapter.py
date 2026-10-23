import shutil
import subprocess
from typing import Any, Dict, Optional
from backend.tools.registry import ToolExecutionResult

class SleuthKitAdapter:
    def __init__(self):
        self.fls_path = shutil.which("fls")
        self.istat_path = shutil.which("istat")
        self.mactime_path = shutil.which("mactime")

    def is_available(self) -> bool:
        return self.fls_path is not None

    def get_version(self) -> Optional[str]:
        if not self.is_available():
            return None
        try:
            res = subprocess.run([self.fls_path, "-V"], capture_output=True, text=True, timeout=5)
            return res.stdout.strip()
        except Exception:
            return "Detected (Version probe failed)"

    def list_files(self, image_path: str) -> ToolExecutionResult:
        if not self.is_available():
            return ToolExecutionResult(
                success=False,
                summary="The Sleuth Kit (fls) is not installed in the local environment.",
                data={"installed": False},
                error="The Sleuth Kit binaries ('fls', 'istat') are missing from the system PATH.",
            )
        try:
            res = subprocess.run([self.fls_path, "-r", image_path], capture_output=True, text=True, timeout=15)
            if res.returncode == 0:
                return ToolExecutionResult(
                    success=True,
                    summary=f"TSK fls completed successfully on {image_path}.",
                    data={"output": res.stdout[:5000]},
                )
            else:
                return ToolExecutionResult(
                    success=False,
                    summary=f"TSK fls returned non-zero exit code: {res.returncode}",
                    data={"stderr": res.stderr},
                    error=res.stderr,
                )
        except Exception as e:
            return ToolExecutionResult(
                success=False,
                summary=f"TSK execution error: {str(e)}",
                data={},
                error=str(e),
            )

tsk_adapter = SleuthKitAdapter()
