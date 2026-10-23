import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_configuration_status_never_returns_nvidia_secret():
    resp = client.get("/api/config/status")
    assert resp.status_code == 200
    payload = resp.json()
    assert "configured" in payload["nvidia"]
    assert "NVIDIA_API_KEY" not in str(payload)

def test_list_cases():
    resp = client.get("/api/cases")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_create_and_get_case():
    payload = {
        "name": "Integration Test Incident",
        "objective": "Verify API case creation workflow",
        "description": "Test case",
        "is_demo": False,
    }
    resp = client.post("/api/cases", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Integration Test Incident"
    case_id = data["id"]

    get_resp = client.get(f"/api/cases/{case_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == case_id

def test_demo_seed_endpoint():
    resp = client.post("/api/demo/seed?case_type=complete")
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    case_id = resp.json()["case_id"]

    # Verify artifacts and timeline exist
    art_resp = client.get(f"/api/cases/{case_id}/artifacts")
    assert art_resp.status_code == 200
    assert len(art_resp.json()) == 1

    time_resp = client.get(f"/api/cases/{case_id}/timeline")
    assert time_resp.status_code == 200
    assert len(time_resp.json()) == 9

def test_tools_status():
    resp = client.get("/api/tools/status")
    assert resp.status_code == 200
    tools = resp.json()
    assert len(tools) >= 6
    assert any(t["name"] == "inspect_case" for t in tools)
