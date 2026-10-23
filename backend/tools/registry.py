import time
from typing import Any, Callable, Dict, List, Optional
from sqlalchemy.orm import Session
from backend.database.models import InvestigationAction, Case, get_utc_now

class ToolExecutionResult:
    def __init__(
        self,
        success: bool,
        summary: str,
        data: Dict[str, Any],
        error: Optional[str] = None,
        duration_ms: float = 0.0,
        evidence_ids: Optional[List[str]] = None,
    ):
        self.success = success
        self.summary = summary
        self.data = data
        self.error = error
        self.duration_ms = duration_ms
        self.evidence_ids = evidence_ids or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "summary": self.summary,
            "data": self.data,
            "error": self.error,
            "duration_ms": self.duration_ms,
            "evidence_ids": self.evidence_ids,
        }

class ToolDefinition:
    def __init__(
        self,
        name: str,
        display_name: str,
        description: str,
        category: str,
        handler: Callable[..., ToolExecutionResult],
        parameters_schema: Dict[str, Any],
    ):
        self.name = name
        self.display_name = display_name
        self.description = description
        self.category = category
        self.handler = handler
        self.parameters_schema = parameters_schema

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}

    def register(self, tool_def: ToolDefinition):
        self._tools[tool_def.name] = tool_def

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_tools(self) -> List[ToolDefinition]:
        return list(self._tools.values())

    def execute_tool(
        self,
        db: Session,
        case_id: str,
        tool_name: str,
        parameters: Dict[str, Any],
        investigation_id: Optional[str] = None,
        sequence_number: int = 1,
        rationale: Optional[str] = None,
        simulated_failure: Optional[str] = None,
    ) -> ToolExecutionResult:
        tool_def = self.get_tool(tool_name)
        if not tool_def:
            return ToolExecutionResult(
                success=False,
                summary=f"Unrecognized tool: {tool_name}",
                data={},
                error=f"Tool '{tool_name}' is not in the approved security tool registry.",
            )

        start_time = time.time()

        # Check for simulated demo failure injection on this case/action
        if simulated_failure:
            case = db.query(Case).filter(Case.id == case_id).first()
            if case and case.is_demo:
                duration_ms = round((time.time() - start_time) * 1000, 2)
                err_msg = ""
                if simulated_failure == "query_failed":
                    err_msg = "Simulated query error: Endpoint forensic index connection timed out (ECONNRESET)."
                elif simulated_failure == "tool_timeout":
                    err_msg = "Simulated execution timeout: Tool exceeded the 15.00s deadline."
                elif simulated_failure == "corrupt_artifact":
                    err_msg = "Simulated artifact anomaly: Corrupt header detected in stream chunk."
                else:
                    err_msg = f"Simulated failure: {simulated_failure}"

                return ToolExecutionResult(
                    success=False,
                    summary=f"Execution Failed: {err_msg}",
                    data={"simulated": True, "failure_type": simulated_failure},
                    error=err_msg,
                    duration_ms=duration_ms,
                )

        try:
            result = tool_def.handler(db=db, case_id=case_id, **parameters)
            result.duration_ms = round((time.time() - start_time) * 1000, 2)
            return result
        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return ToolExecutionResult(
                success=False,
                summary=f"Tool execution exception: {str(e)}",
                data={},
                error=str(e),
                duration_ms=duration_ms,
            )

# Global tool registry instance
registry = ToolRegistry()
