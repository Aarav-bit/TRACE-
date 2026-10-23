import logging
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import backend.config as config

router = APIRouter(prefix="/api/settings", tags=["settings"])
logger = logging.getLogger("trace.settings")

class SettingsResponse(BaseModel):
    llm_provider: str
    nvidia_model: str
    nvidia_api_key_configured: bool
    nvidia_api_key_masked: str
    gemini_api_key_configured: bool
    openai_api_key_configured: bool
    max_investigation_steps: int
    tool_timeout_seconds: int

class SettingsUpdateRequest(BaseModel):
    llm_provider: Optional[str] = None
    nvidia_api_key: Optional[str] = None
    nvidia_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    max_investigation_steps: Optional[int] = None
    tool_timeout_seconds: Optional[int] = None

class TestNvidiaRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = None

@router.get("", response_model=SettingsResponse)
def get_settings():
    """Returns current active system runtime configuration and masked credentials."""
    masked_nvidia = ""
    if config.NVIDIA_API_KEY:
        masked_nvidia = (
            config.NVIDIA_API_KEY[:8] + "..." + config.NVIDIA_API_KEY[-4:]
            if len(config.NVIDIA_API_KEY) > 12
            else "nvapi-***"
        )

    return SettingsResponse(
        llm_provider=config.LLM_PROVIDER,
        nvidia_model=config.NVIDIA_MODEL,
        nvidia_api_key_configured=bool(config.NVIDIA_API_KEY),
        nvidia_api_key_masked=masked_nvidia,
        gemini_api_key_configured=bool(config.GEMINI_API_KEY),
        openai_api_key_configured=bool(config.OPENAI_API_KEY),
        max_investigation_steps=config.MAX_INVESTIGATION_STEPS,
        tool_timeout_seconds=config.TOOL_TIMEOUT_SECONDS,
    )

@router.post("", response_model=SettingsResponse)
def update_settings(payload: SettingsUpdateRequest):
    """Updates runtime configuration and persists non-sensitive changes to .env."""
    config.update_runtime_config(
        provider=payload.llm_provider,
        nvidia_key=payload.nvidia_api_key,
        nvidia_model=payload.nvidia_model,
        gemini_key=payload.gemini_api_key,
        openai_key=payload.openai_api_key,
        max_steps=payload.max_investigation_steps,
        timeout=payload.tool_timeout_seconds,
    )
    logger.info(f"Configuration updated: provider={config.LLM_PROVIDER}, nvidia_model={config.NVIDIA_MODEL}")
    return get_settings()

@router.post("/test-nvidia")
async def test_nvidia_connection(payload: TestNvidiaRequest):
    """Validates connectivity to the NVIDIA NIM Nemotron API."""
    test_key = payload.api_key.strip() if payload.api_key else config.NVIDIA_API_KEY
    test_model = payload.model.strip() if payload.model else config.NVIDIA_MODEL

    if not test_key:
        raise HTTPException(status_code=400, detail="No NVIDIA API key provided or configured.")

    url = f"{config.NVIDIA_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {test_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    test_payload = {
        "model": test_model,
        "messages": [
            {"role": "user", "content": "Respond with the word 'OK' if you receive this test ping."}
        ],
        "max_tokens": 10,
        "temperature": 0.1,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=test_payload)
            if resp.status_code == 200:
                data = resp.json()
                reply = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                return {
                    "success": True,
                    "model": test_model,
                    "status_code": 200,
                    "message": "NVIDIA NIM Nemotron API connection verified successfully.",
                    "sample_response": reply,
                }
            else:
                err_detail = resp.text[:300]
                return {
                    "success": False,
                    "status_code": resp.status_code,
                    "error": f"NVIDIA API responded with HTTP {resp.status_code}: {err_detail}",
                }
    except Exception as e:
        return {
            "success": False,
            "status_code": 500,
            "error": f"Connection to NVIDIA NIM failed: {str(e)}",
        }
