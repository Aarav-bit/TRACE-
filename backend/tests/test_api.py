import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

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

def test_settings_endpoints():
    # Test GET settings
    resp = client.get("/api/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert "nvidia_model" in data
    assert "llm_provider" in data

    # Test POST update settings
    update_payload = {
        "llm_provider": "nvidia",
        "nvidia_model": "nvidia/nemotron-3.5-super-vl-120b-a12b",
        "max_investigation_steps": 20,
    }
    update_resp = client.post("/api/settings", json=update_payload)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["llm_provider"] == "nvidia"
    assert updated_data["nvidia_model"] == "nvidia/nemotron-3.5-super-vl-120b-a12b"
    assert updated_data["max_investigation_steps"] == 20

    # Test test-nvidia validation with empty key
    test_resp = client.post("/api/settings/test-nvidia", json={"api_key": ""})
    assert test_resp.status_code in [200, 400]
