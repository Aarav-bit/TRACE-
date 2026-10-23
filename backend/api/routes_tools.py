from typing import List, Optional
from fastapi import APIRouter
from backend.database.schemas import ToolStatusItem
from backend.tools.adapters.status import get_all_tool_statuses
import backend.config as config

router = APIRouter(prefix="/api/tools", tags=["tools"])

@router.get("/status", response_model=List[ToolStatusItem])
def get_tools_status():
    return get_all_tool_statuses()

@router.post("/toggle-bridge")
def toggle_tools_bridge():
    config.ENABLE_EXTERNAL_TOOL_MOCKS = not getattr(config, "ENABLE_EXTERNAL_TOOL_MOCKS", True)
    return {
        "bridge_enabled": config.ENABLE_EXTERNAL_TOOL_MOCKS,
        "mode": "Integrated Forensic Bridge" if config.ENABLE_EXTERNAL_TOOL_MOCKS else "Physical Host PATH Only",
    }
