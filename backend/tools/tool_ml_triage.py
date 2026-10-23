from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from backend.database.models import EvidenceEvent, Case
from backend.ml.triage_engine import get_triage_engine
from backend.tools.registry import ToolExecutionResult, ToolDefinition, registry


def ml_triage_handler(db: Session, case_id: str, **kwargs) -> ToolExecutionResult:
    """
    Executes trained ML models (Logistic Regression, Random Forest, XGBoost, TF-IDF)
    over evidence events to perform automated forensic triage and scenario classification.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return ToolExecutionResult(
            success=False,
            summary="Case not found",
            data={},
            error=f"Case ID {case_id} does not exist.",
        )

    events = (
        db.query(EvidenceEvent)
        .filter(EvidenceEvent.case_id == case_id)
        .order_by(EvidenceEvent.timestamp_utc.asc())
        .all()
    )

    if not events:
        return ToolExecutionResult(
            success=True,
            summary="No evidence events available to evaluate with ML models.",
            data={"total_events": 0, "flagged": []},
            evidence_ids=[],
        )

    engine = get_triage_engine()
    scenario_algo = kwargs.get("scenario_algorithm", "tfidf_logistic_regression")
    triage_algo = kwargs.get("triage_algorithm", "random_forest")

    flagged_events = []
    evidence_ids = []
    scenario_counts: Dict[str, int] = {}
    total_risk = 0.0

    for ev in events:
        features = engine.extract_features_from_evidence_event(ev)
        res = engine.full_triage(features, scenario_algo=scenario_algo, triage_algo=triage_algo)

        scen = res["scenario"]
        scenario_counts[scen] = scenario_counts.get(scen, 0) + 1
        total_risk += res["risk_score"]

        if res["flagged"] or res["risk_score"] >= 50:
            evidence_ids.append(ev.id)
            flagged_events.append({
                "record_id": ev.source_record_id,
                "event_type": ev.event_type,
                "timestamp": ev.timestamp_utc.isoformat() if ev.timestamp_utc else str(ev.original_timestamp),
                "scenario": res["scenario"],
                "risk_tier": res["risk_tier"],
                "risk_score": res["risk_score"],
                "probability_flagged": res["probability_flagged"],
                "risk_factors": res["risk_factors"],
                "summary": ev.normalized_fields.get("description") or ev.normalized_fields.get("command_line") or ev.event_type,
            })

    flagged_events.sort(key=lambda x: x["risk_score"], reverse=True)
    primary_scenario = max(scenario_counts.items(), key=lambda x: x[1])[0] if scenario_counts else "unknown"
    avg_risk = round(total_risk / len(events), 1)

    summary = (
        f"ML Forensic Triage completed: Evaluated {len(events)} events using {scenario_algo} + {triage_algo}. "
        f"Primary scenario classified as '{primary_scenario}' with {len(flagged_events)} high-risk anomalies flagged "
        f"(Average risk score: {avg_risk}/100)."
    )

    return ToolExecutionResult(
        success=True,
        summary=summary,
        data={
            "case_id": case_id,
            "total_events_evaluated": len(events),
            "flagged_anomalies_count": len(flagged_events),
            "primary_scenario": primary_scenario,
            "scenario_distribution": scenario_counts,
            "average_risk_score": avg_risk,
            "flagged_events": flagged_events[:10],
            "algorithms": {
                "scenario": scenario_algo,
                "triage": triage_algo,
            },
        },
        evidence_ids=evidence_ids,
    )


# Auto-register into TRACE Tool Registry
registry.register(
    ToolDefinition(
        name="ml_forensic_triage",
        display_name="ML Forensic Triage & Attack Classifier",
        description="Applies supervised ML models (XGBoost, Random Forest, TF-IDF Logistic Regression) to classify attack scenarios and prioritize high-risk forensic anomalies.",
        category="analytics",
        handler=ml_triage_handler,
        parameters_schema={
            "type": "object",
            "properties": {
                "scenario_algorithm": {
                    "type": "string",
                    "enum": ["tfidf_logistic_regression", "logistic_regression", "random_forest", "xgboost"],
                    "default": "tfidf_logistic_regression",
                    "description": "Model algorithm for threat scenario classification",
                },
                "triage_algorithm": {
                    "type": "string",
                    "enum": ["random_forest", "xgboost", "logistic_regression", "tfidf_logistic_regression"],
                    "default": "random_forest",
                    "description": "Model algorithm for risk priority triage",
                },
            },
        },
    )
)
