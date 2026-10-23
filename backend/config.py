import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "data" / "storage"
SYNTHETIC_DIR = BASE_DIR / "data" / "synthetic_cases"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
SYNTHETIC_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'trace.db'}")

# Security & limits
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", 50 * 1024 * 1024))  # 50 MB
MAX_FILES_PER_UPLOAD = int(os.getenv("MAX_FILES_PER_UPLOAD", 10))
MAX_INVESTIGATION_STEPS = int(os.getenv("MAX_INVESTIGATION_STEPS", 15))
TOOL_TIMEOUT_SECONDS = int(os.getenv("TOOL_TIMEOUT_SECONDS", 15))
MAX_RETRY_COUNT = int(os.getenv("MAX_RETRY_COUNT", 2))

# Agent / LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "deterministic")  # "deterministic", "gemini", "openai"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-flash")

# Demo / Failure Injection state (persisted in-memory/flag)
ALLOW_DEMO_FAILURE_INJECTION = True
