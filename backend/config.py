import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

def _env_int(name: str, default: int, minimum: int = 1, maximum: int | None = None) -> int:
    """Read a bounded integer environment variable without crashing at import time."""
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        return default
    if value < minimum:
        return default
    return min(value, maximum) if maximum is not None else value

STORAGE_DIR = BASE_DIR / "data" / "storage"
SYNTHETIC_DIR = BASE_DIR / "data" / "synthetic_cases"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
SYNTHETIC_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'trace.db'}")

# Security & limits
MAX_UPLOAD_SIZE_BYTES = _env_int("MAX_UPLOAD_SIZE_BYTES", 50 * 1024 * 1024, maximum=500 * 1024 * 1024)
MAX_FILES_PER_UPLOAD = _env_int("MAX_FILES_PER_UPLOAD", 10, maximum=50)
MAX_INVESTIGATION_STEPS = _env_int("MAX_INVESTIGATION_STEPS", 12, maximum=12)
TOOL_TIMEOUT_SECONDS = _env_int("TOOL_TIMEOUT_SECONDS", 15, maximum=300)
MAX_TOOL_OUTPUT_BYTES = _env_int("MAX_TOOL_OUTPUT_BYTES", 1_000_000, maximum=5_000_000)
MAX_RETRY_COUNT = _env_int("MAX_RETRY_COUNT", 2, maximum=3)
MAX_EXTRACTION_SIZE_BYTES = _env_int("MAX_EXTRACTION_SIZE_BYTES", 100 * 1024 * 1024, maximum=2 * 1024 * 1024 * 1024)

# Agent / LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "deterministic").lower()
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "nvidia/nemotron-3.5-super-vl-120b-a12b")

# Paths are configuration only; adapters independently verify them before use.
AUTOPSY_PATH = os.getenv("AUTOPSY_PATH", "")
TSK_BIN_DIR = os.getenv("TSK_BIN_DIR", "")
EVIDENCE_WORK_DIR = Path(os.getenv("EVIDENCE_WORK_DIR", str(STORAGE_DIR / "work"))).resolve()
EVIDENCE_WORK_DIR.mkdir(parents=True, exist_ok=True)

# Demo / Failure Injection state (persisted in-memory/flag)
ALLOW_DEMO_FAILURE_INJECTION = True
