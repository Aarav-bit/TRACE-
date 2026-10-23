from typing import List
from fastapi import APIRouter
from backend.database.schemas import ToolStatusItem
from backend.tools.adapters.status import get_all_tool_statuses

router = APIRouter(prefix="/api/tools", tags=["tools"])

@router.get("/status", response_model=List[ToolStatusItem])
def get_tools_status():
    return get_all_tool_statuses()
