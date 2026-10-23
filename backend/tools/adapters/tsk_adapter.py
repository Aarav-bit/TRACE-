"""Constrained adapter for The Sleuth Kit command-line utilities."""
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

from backend.config import MAX_TOOL_OUTPUT_BYTES, TOOL_TIMEOUT_SECONDS, TSK_BIN_DIR
from backend.tools.registry import ToolExecutionResult


class SleuthKitAdapter:
    executable_names = {"mmls", "fsstat", "fls", "istat", "icat"}

    def __init__(self) -> None:
        self.paths = {name: self._find_binary(name) for name in self.executable_names}

    @staticmethod
    def _find_binary(name: str) -> Optional[str]:
        configured = Path(TSK_BIN_DIR) / f"{name}.exe" if TSK_BIN_DIR else None
        if configured and configured.is_file():
            return str(configured)
        return shutil.which(name) or shutil.which(f"{name}.exe")

    def is_available(self) -> bool:
        return any(self.paths.values())

    def available_operations(self) -> List[str]:
        return sorted(name for name, path in self.paths.items() if path)

    def get_version(self) -> Optional[str]:
        path = self.paths.get("fls") or next((path for path in self.paths.values() if path), None)
        if not path:
            return None
        result = self._run_raw([path, "-V"])
        return result.data.get("stdout", "Detected (version probe failed)") if result.success else "Detected (version probe failed)"

    def execute(
        self,
        operation: str,
        image_path: Path,
        args_before_image: List[str],
        args_after_image: Optional[List[str]] = None,
        binary_output: bool = False,
    ) -> ToolExecutionResult:
        if operation not in self.executable_names:
            return ToolExecutionResult(False, "Rejected unapproved Sleuth Kit operation.", {}, "Unapproved operation")
        executable = self.paths.get(operation)
        if not executable:
            return ToolExecutionResult(
                False,
                f"The Sleuth Kit '{operation}' binary is not configured.",
                {"installed": False, "available_operations": self.available_operations()},
                f"Set TSK_BIN_DIR or add {operation} to PATH.",
            )
        if not image_path.is_file():
            return ToolExecutionResult(False, "Evidence image is unavailable.", {}, "Case artifact path is missing")
        # The caller supplies only whitelisted flags and validated primitives.
        result = self._run_raw(
            [executable, *args_before_image, str(image_path), *(args_after_image or [])],
            binary_output=binary_output,
        )
        result.data["operation"] = operation
        result.data["image_name"] = image_path.name
        return result

    @staticmethod
    def _run_raw(command: List[str], binary_output: bool = False) -> ToolExecutionResult:
        try:
            completed = subprocess.run(
                command,
                capture_output=True,
                timeout=TOOL_TIMEOUT_SECONDS,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return ToolExecutionResult(False, "Forensic tool timed out.", {}, f"Timeout after {TOOL_TIMEOUT_SECONDS}s")
        except OSError as exc:
            return ToolExecutionResult(False, "Forensic tool could not be launched.", {}, str(exc))

        stdout = completed.stdout[:MAX_TOOL_OUTPUT_BYTES]
        stderr = completed.stderr[:MAX_TOOL_OUTPUT_BYTES]
        if completed.returncode != 0:
            return ToolExecutionResult(
                False,
                f"Forensic tool returned exit code {completed.returncode}.",
                {"exit_code": completed.returncode, "stderr": stderr.decode("utf-8", "replace")},
                stderr.decode("utf-8", "replace"),
            )
        if binary_output:
            return ToolExecutionResult(True, "Forensic binary extraction completed.", {"bytes": stdout, "exit_code": 0})
        return ToolExecutionResult(
            True,
            "Forensic tool completed successfully.",
            {"stdout": stdout.decode("utf-8", "replace"), "stderr": stderr.decode("utf-8", "replace"), "exit_code": 0},
        )


tsk_adapter = SleuthKitAdapter()
