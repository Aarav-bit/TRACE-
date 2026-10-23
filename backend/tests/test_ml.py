import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.ml.triage_engine import get_triage_engine

client = TestClient(app)


def test_ml_models_info():
    resp = client.get("/api/ml/models")
    assert resp.status_code == 200
    data = resp.json()
    assert "models" in data
    assert len(data["models"]) == 8
    assert "benchmarks" in data
    assert len(data["benchmarks"]) >= 5


def test_ml_predict_event_high_risk():
    payload = {
        "hour_of_day": 3,
        "usb_connected": 1,
        "bytes_transferred": 250000000,
        "failed_logins_24h": 6,
        "deleted_after_activity": 1,
        "artifact_type": "usb_event",
        "action": "write_usb",
        "file_extension": "pdf",
        "external_destination": "cloud_storage",
    }
    resp = client.post("/api/ml/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "scenario" in data
    assert data["scenario"] in ["data_leakage", "timeline_anomaly", "suspicious_web_activity"]
    assert "risk_tier" in data
    assert data["risk_score"] >= 0
    assert len(data["risk_factors"]) >= 2


def test_ml_predict_event_normal():
    payload = {
        "hour_of_day": 14,
        "usb_connected": 0,
        "bytes_transferred": 1200,
        "failed_logins_24h": 0,
        "deleted_after_activity": 0,
        "artifact_type": "process_event",
        "action": "execute",
        "file_extension": "exe",
        "external_destination": "none",
    }
    resp = client.post("/api/ml/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "scenario" in data
    assert data["risk_tier"] in ["LOW", "MEDIUM"]


def test_ml_triage_seeded_case():
    seed_resp = client.post("/api/demo/seed?case_type=complete")
    assert seed_resp.status_code == 200
    case_id = seed_resp.json()["case_id"]

    triage_resp = client.post(f"/api/ml/triage-case/{case_id}")
    assert triage_resp.status_code == 200
    data = triage_resp.json()
    assert data["case_id"] == case_id
    assert data["total_events"] >= 8
    assert "ranked_events" in data
    assert len(data["ranked_events"]) >= 8
    assert "primary_scenario" in data
