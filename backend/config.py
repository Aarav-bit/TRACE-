import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "data" / "storage"
SYNTHETIC_DIR = BASE_DIR / "data" / "synthetic_cases"
SAMPLE_DIR = BASE_DIR / "data" / "sample_evidence"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
SYNTHETIC_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'trace.db'}")

# Security & limits
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", 50 * 1024 * 1024))  # 50 MB
MAX_FILES_PER_UPLOAD = int(os.getenv("MAX_FILES_PER_UPLOAD", 10))
MAX_INVESTIGATION_STEPS = int(os.getenv("MAX_INVESTIGATION_STEPS", 15))
TOOL_TIMEOUT_SECONDS = int(os.getenv("TOOL_TIMEOUT_SECONDS", 15))
MAX_RETRY_COUNT = int(os.getenv("MAX_RETRY_COUNT", 2))

# Agent / LLM Configuration
# Options: "nvidia", "nemotron", "gemini", "openai", "deterministic"
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "nvidia" if os.getenv("NVIDIA_API_KEY") else "deterministic")

# NVIDIA NIM / Nemotron Configuration
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "nvidia/nemotron-3.5-super-vl-120b-a12b")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")

# Other providers
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-flash")

# Demo / Failure Injection state
ALLOW_DEMO_FAILURE_INJECTION = True
ENABLE_EXTERNAL_TOOL_MOCKS = os.getenv("ENABLE_EXTERNAL_TOOL_MOCKS", "true").lower() in ("true", "1", "yes")

def update_runtime_config(
    provider: str = None,
    nvidia_key: str = None,
    nvidia_model: str = None,
    gemini_key: str = None,
    openai_key: str = None,
    max_steps: int = None,
    timeout: int = None,
):
    """Updates runtime configuration in memory and persists to .env file."""
    global LLM_PROVIDER, NVIDIA_API_KEY, NVIDIA_MODEL, GEMINI_API_KEY, OPENAI_API_KEY, MAX_INVESTIGATION_STEPS, TOOL_TIMEOUT_SECONDS

    if provider:
        LLM_PROVIDER = provider
    if nvidia_key is not None:
        NVIDIA_API_KEY = nvidia_key.strip()
    if nvidia_model:
        NVIDIA_MODEL = nvidia_model.strip()
    if gemini_key is not None:
        GEMINI_API_KEY = gemini_key.strip()
    if openai_key is not None:
        OPENAI_API_KEY = openai_key.strip()
    if max_steps:
        MAX_INVESTIGATION_STEPS = max_steps
    if timeout:
        TOOL_TIMEOUT_SECONDS = timeout

    # Save to .env
    env_path = BASE_DIR / ".env"
    env_content = f"""LLM_PROVIDER={LLM_PROVIDER}
NVIDIA_API_KEY={NVIDIA_API_KEY}
NVIDIA_MODEL={NVIDIA_MODEL}
NVIDIA_BASE_URL={NVIDIA_BASE_URL}
GEMINI_API_KEY={GEMINI_API_KEY}
OPENAI_API_KEY={OPENAI_API_KEY}
MAX_INVESTIGATION_STEPS={MAX_INVESTIGATION_STEPS}
TOOL_TIMEOUT_SECONDS={TOOL_TIMEOUT_SECONDS}
"""
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(env_content)
    except Exception:
        pass
