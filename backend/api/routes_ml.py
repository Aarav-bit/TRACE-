from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import Case, Artifact, EvidenceEvent
from backend.ml.triage_engine import get_triage_engine

router = APIRouter(prefix="/api/ml", tags=["Machine Learning Forensic Triage"])


class EventTriageRequest(BaseModel):
    hour_of_day: int = Field(default=12, ge=0, le=23, description="Hour event occurred (0-23)")
    usb_connected: int = Field(default=0, ge=0, le=1, description="Whether USB mass storage was connected")
    bytes_transferred: int = Field(default=0, ge=0, description="Bytes transferred over network or drive")
    failed_logins_24h: int = Field(default=0, ge=0, description="Count of failed logins in preceding 24h")
    deleted_after_activity: int = Field(default=0, ge=0, le=1, description="Artifact or log deletion observed")
    artifact_type: str = Field(default="process_event", description="Type of evidence artifact")
    action: str = Field(default="execute", description="Action performed")
    file_extension: str = Field(default="none", description="File extension involved")
    external_destination: str = Field(default="none", description="Destination network endpoint or cloud category")
    scenario: Optional[str] = Field(default=None, description="Pre-classified scenario if known (otherwise predicted)")
    scenario_algorithm: Optional[str] = Field(default="tfidf_logistic_regression", description="Algorithm for scenario")
    triage_algorithm: Optional[str] = Field(default="random_forest", description="Algorithm for triage")


class EventTriageResponse(BaseModel):
    scenario: str
    scenario_confidence: float
    scenario_probabilities: Dict[str, float]
    flagged: bool
    risk_tier: str
    risk_score: float
    probability_flagged: float
    risk_factors: List[str]
    algorithms: Dict[str, str]


@router.get("/models")
def get_model_info():
    """Returns available forensic ML models, supported tasks, and benchmark comparisons."""
    engine = get_triage_engine()
    return {
        "models": engine.get_available_models(),
        "benchmarks": engine.get_benchmarks(),
        "tasks": ["scenario", "triage_label"],
        "default_scenario_model": "tfidf_logistic_regression",
        "default_triage_model": "random_forest",
    }


@router.post("/predict", response_model=EventTriageResponse)
def predict_event(payload: EventTriageRequest):
    """Real-time forensic scenario classification and triage risk assessment on event parameters."""
    engine = get_triage_engine()
    event_dict = payload.model_dump(exclude={"scenario_algorithm", "triage_algorithm"})
    scenario_algo = payload.scenario_algorithm or "tfidf_logistic_regression"
    triage_algo = payload.triage_algorithm or "random_forest"

    result = engine.full_triage(
        event_dict,
        scenario_algo=scenario_algo,
        triage_algo=triage_algo,
    )
    return result


@router.post("/triage-case/{case_id}")
def triage_case_evidence(
    case_id: str,
    scenario_algo: str = "tfidf_logistic_regression",
    triage_algo: str = "random_forest",
    db: Session = Depends(get_db),
):
    """
    Evaluates all evidence events in a case with the trained forensic ML models.
    Returns case risk profile, scenario consensus, and prioritized high-risk evidence events.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    events = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case_id).order_by(EvidenceEvent.timestamp_utc.asc()).all()
    if not events:
        return {
            "case_id": case_id,
            "case_name": case.name,
            "total_events": 0,
            "flagged_count": 0,
            "case_risk_tier": "LOW",
            "case_risk_score": 0.0,
            "primary_scenario": "unknown",
            "scenario_distribution": {},
            "ranked_events": [],
            "message": "No evidence events found in this case to triage.",
        }

    engine = get_triage_engine()
    ranked_events = []
    scenario_counts: Dict[str, int] = {}
    flagged_count = 0
    total_risk_score = 0.0

    for ev in events:
        features = engine.extract_features_from_evidence_event(ev)
        triage_res = engine.full_triage(features, scenario_algo=scenario_algo, triage_algo=triage_algo)

        scen = triage_res["scenario"]
        scenario_counts[scen] = scenario_counts.get(scen, 0) + 1

        if triage_res["flagged"]:
            flagged_count += 1
        total_risk_score += triage_res["risk_score"]

        ranked_events.append({
            "event_id": ev.id,
            "source_record_id": ev.source_record_id,
            "timestamp": ev.timestamp_utc.isoformat() if ev.timestamp_utc else str(ev.original_timestamp),
            "event_type": ev.event_type,
            "extracted_features": features,
            "scenario": triage_res["scenario"],
            "scenario_confidence": triage_res["scenario_confidence"],
            "flagged": triage_res["flagged"],
            "risk_tier": triage_res["risk_tier"],
            "risk_score": triage_res["risk_score"],
            "probability_flagged": triage_res["probability_flagged"],
            "risk_factors": triage_res["risk_factors"],
            "description": ev.normalized_fields.get("description") or ev.normalized_fields.get("command_line") or ev.event_type,
        })

    # Sort events by risk score descending
    ranked_events.sort(key=lambda x: x["risk_score"], reverse=True)

    avg_risk_score = round(total_risk_score / len(events), 1)
    primary_scenario = max(scenario_counts.items(), key=lambda x: x[1])[0] if scenario_counts else "unknown"

    # Overall case tier
    max_event_risk = max((e["risk_score"] for e in ranked_events), default=0.0)
    if max_event_risk >= 75 or flagged_count >= 3:
        case_risk_tier = "CRITICAL"
    elif max_event_risk >= 50 or flagged_count >= 1:
        case_risk_tier = "HIGH"
    elif avg_risk_score >= 25:
        case_risk_tier = "MEDIUM"
    else:
        case_risk_tier = "LOW"

    return {
        "case_id": case_id,
        "case_name": case.name,
        "total_events": len(events),
        "flagged_count": flagged_count,
        "case_risk_tier": case_risk_tier,
        "average_risk_score": avg_risk_score,
        "max_risk_score": max_event_risk,
        "primary_scenario": primary_scenario,
        "scenario_distribution": scenario_counts,
        "ranked_events": ranked_events,
    }
