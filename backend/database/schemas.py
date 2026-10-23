from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

# Case schemas
class CaseCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    objective: str = Field(..., min_length=5)
    description: Optional[str] = None
    is_demo: bool = False
    demo_type: Optional[str] = None

class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    objective: str
    description: Optional[str] = None
    status: str
    is_demo: bool = False
    demo_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    artifact_count: int = 0
    finding_count: int = 0
    event_count: int = 0
    last_activity: Optional[datetime] = None

# Artifact schemas
class ArtifactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    original_filename: str
    artifact_type: str
    file_size: int
    sha256: str
    parser_name: str
    parser_status: str
    record_count: int
    warnings: Optional[str] = None
    created_at: datetime

# EvidenceEvent schemas
class EvidenceEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    artifact_id: str
    source_record_id: str
    timestamp_utc: datetime
    original_timestamp: str
    timezone_metadata: str
    event_type: str
    normalized_fields: Dict[str, Any]
    source_hash: str
    created_at: datetime

# Investigation schemas
class InvestigationCreate(BaseModel):
    objective: Optional[str] = None
    mode: str = "deterministic"
    max_steps: int = 15

class InvestigationActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    sequence_number: int
    tool_name: str
    action_type: str
    rationale: Optional[str] = None
    validated_inputs: Dict[str, Any] = {}
    status: str
    result_summary: Optional[str] = None
    structured_result: Optional[Dict[str, Any]] = None
    error_details: Optional[str] = None
    retry_count: int = 0
    started_at: datetime
    completed_at: Optional[datetime] = None

class InvestigationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    status: str
    objective: str
    current_hypothesis: Optional[str] = None
    mode: str
    steps_used: int = 0
    max_steps: int = 15
    termination_reason: Optional[str] = None
    simulated_failure: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    actions: List[InvestigationActionResponse] = []

# Finding schemas
class FindingEvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    evidence_event_id: str
    relationship_type: str
    explanation: Optional[str] = None
    source_record_id: Optional[str] = None
    event_type: Optional[str] = None
    timestamp_utc: Optional[datetime] = None

class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    investigation_id: Optional[str] = None
    title: str
    claim: str
    status: str  # supported, contradicted, unresolved
    confidence_assessment: str
    verification_method: str
    verification_details: Dict[str, Any] = {}
    uncertainty_notes: Optional[str] = None
    suggested_next_action: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    evidence_links: List[FindingEvidenceResponse] = []

# Relationship schemas
class EvidenceRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    source_entity_id: str
    target_entity_id: str
    relationship_type: str
    relationship_class: str
    evidence_ids: List[str] = []
    matching_criteria: Optional[str] = None
    verification_status: str

# Tool execution schemas
class ToolExecutionRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any] = {}

class ToolStatusItem(BaseModel):
    name: str
    display_name: str
    category: str
    installed: bool
    version: Optional[str] = None
    supported_operations: List[str] = []
    last_health_check: str
    configuration_guidance: str

# Demo control schemas
class FailureInjectionRequest(BaseModel):
    failure_type: str
    tool_target: Optional[str] = None
    description: Optional[str] = None
