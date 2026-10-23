import shutil
from typing import Optional
from backend.tools.registry import ToolExecutionResult

class VolatilityAdapter:
    def __init__(self):
        self.vol_path = shutil.which("vol") or shutil.which("volatility") or shutil.which("vol.py")
        self._check_python_module()

    def _check_python_module(self):
        self.has_module = False
        try:
            import volatility3
            self.has_module = True
        except ImportError:
            self.has_module = False

    def is_available(self) -> bool:
        return self.vol_path is not None or self.has_module

    def get_version(self) -> Optional[str]:
        if not self.is_available():
            return None
        return "Volatility 3 Framework"

    def analyze_memory(self, memory_dump_path: str, plugin: str = "windows.pslist") -> ToolExecutionResult:
        if not self.is_available():
            return ToolExecutionResult(
                success=False,
                summary="Volatility 3 framework is not installed in the environment.",
                data={"installed": False},
                error="Volatility 3 (CLI or Python module) is not available.",
            )
        return ToolExecutionResult(
            success=False,
            summary="Memory analysis skipped: No valid raw memory image (*.raw, *.dmp) found.",
            data={},
            error="Artifact is an endpoint log bundle, not a memory dump.",
        )

volatility_adapter = VolatilityAdapter()
