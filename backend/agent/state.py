import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

@dataclass
class InvestigationState:
    case_id: str
    investigation_id: str
    objective: str
    current_hypothesis: str = "Initial assessment of ingested endpoint telemetry."
    current_phase: str = "Reconnaissance"
    proposed_plan: List[str] = field(default_factory=lambda: [
        "Inspect case manifest and verify artifact integrity",
        "Search for suspicious process creation events",
        "Trace process ancestry and parentage",
        "Extract PowerShell script blocks and encoded commands",
        "Correlate file activity and network sockets",
        "Submit findings to independent deterministic verifier",
    ])
    completed_steps: int = 0
    max_steps: int = 15
    discovered_evidence_ids: List[str] = field(default_factory=list)
    findings_generated: List[str] = field(default_factory=list)
    contradictions: List[str] = field(default_factory=list)
    evidence_gaps: List[str] = field(default_factory=list)
    failure_history: List[Dict[str, Any]] = field(default_factory=list)
    retry_count: int = 0
    max_retries_per_step: int = 2
    termination_reason: Optional[str] = None
    is_paused: bool = False
    is_stopped: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "investigation_id": self.investigation_id,
            "objective": self.objective,
            "current_hypothesis": self.current_hypothesis,
            "current_phase": self.current_phase,
            "proposed_plan": self.proposed_plan,
            "completed_steps": self.completed_steps,
            "max_steps": self.max_steps,
            "discovered_evidence_ids": self.discovered_evidence_ids,
            "findings_generated": self.findings_generated,
            "contradictions": self.contradictions,
            "evidence_gaps": self.evidence_gaps,
            "failure_history": self.failure_history,
            "retry_count": self.retry_count,
            "termination_reason": self.termination_reason,
            "is_paused": self.is_paused,
            "is_stopped": self.is_stopped,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "InvestigationState":
        return cls(
            case_id=data.get("case_id", ""),
            investigation_id=data.get("investigation_id", ""),
            objective=data.get("objective", ""),
            current_hypothesis=data.get("current_hypothesis", ""),
            current_phase=data.get("current_phase", "Reconnaissance"),
            proposed_plan=data.get("proposed_plan", []),
            completed_steps=data.get("completed_steps", 0),
            max_steps=data.get("max_steps", 15),
            discovered_evidence_ids=data.get("discovered_evidence_ids", []),
            findings_generated=data.get("findings_generated", []),
            contradictions=data.get("contradictions", []),
            evidence_gaps=data.get("evidence_gaps", []),
            failure_history=data.get("failure_history", []),
            retry_count=data.get("retry_count", 0),
            termination_reason=data.get("termination_reason"),
            is_paused=data.get("is_paused", False),
            is_stopped=data.get("is_stopped", False),
        )
