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

    @property
    def json_schema(self) -> Dict[str, Any]:
        """OpenAI-compatible schema exposed to the model, never an execution surface."""
        properties = {}
        for name, definition in self.parameters_schema.items():
            properties[name] = {
                key: value for key, value in definition.items()
                if key in {"type", "items", "description", "default", "enum", "minimum", "maximum"}
            }
        return {"type": "object", "properties": properties, "additionalProperties": False}

    def validate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate narrow tool arguments before a handler can observe them."""
        if not isinstance(parameters, dict):
            raise ValueError("Tool arguments must be a JSON object")
        unknown = set(parameters) - set(self.parameters_schema)
        if unknown:
            raise ValueError(f"Unsupported argument(s): {', '.join(sorted(unknown))}")

        validated: Dict[str, Any] = {}
        for name, definition in self.parameters_schema.items():
            if name not in parameters:
                if definition.get("required"):
                    raise ValueError(f"Missing required argument: '{name}'")
                if "default" in definition:
                    validated[name] = definition["default"]
                continue
            value = parameters[name]
            field_type = definition.get("type")
            if field_type == "string" and (not isinstance(value, str) or len(value) > 2_000):
                raise ValueError(f"'{name}' must be a string no longer than 2000 characters")
            if field_type == "integer" and (not isinstance(value, int) or isinstance(value, bool)):
                raise ValueError(f"'{name}' must be an integer")
            if field_type == "boolean" and not isinstance(value, bool):
                raise ValueError(f"'{name}' must be a boolean")
            if field_type == "array":
                if not isinstance(value, list) or len(value) > 100:
                    raise ValueError(f"'{name}' must be an array containing at most 100 items")
                if definition.get("items", {}).get("type") == "string" and any(
                    not isinstance(item, str) or len(item) > 2_000 for item in value
                ):
                    raise ValueError(f"'{name}' must contain strings no longer than 2000 characters")
            if "minimum" in definition and value < definition["minimum"]:
                raise ValueError(f"'{name}' is below the permitted minimum")
            if "maximum" in definition and value > definition["maximum"]:
                raise ValueError(f"'{name}' exceeds the permitted maximum")
            if definition.get("enum") and value not in definition["enum"]:
                raise ValueError(f"'{name}' is not an approved value")
            validated[name] = value
        return validated

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}

    def register(self, tool_def: ToolDefinition):
        self._tools[tool_def.name] = tool_def

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_tools(self) -> List[ToolDefinition]:
        return list(self._tools.values())

    def validate_tool_arguments(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        tool_def = self.get_tool(tool_name)
        if not tool_def:
            raise ValueError(f"Tool '{tool_name}' is not in the approved registry")
        return tool_def.validate(parameters)

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

        try:
            validated_parameters = tool_def.validate(parameters)
        except ValueError as exc:
            return ToolExecutionResult(
                success=False,
                summary=f"Rejected invalid arguments for approved tool '{tool_name}'.",
                data={"tool": tool_name, "validation_error": str(exc)},
                error=str(exc),
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
            result = tool_def.handler(db=db, case_id=case_id, **validated_parameters)
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
