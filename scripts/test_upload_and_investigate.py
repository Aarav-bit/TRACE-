import httpx
import time
from pathlib import Path

def main():
    client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=20.0)

    print("[1] Creating new real incident case...")
    case = client.post("/api/cases", json={
        "name": "INC-2026-9042: Real Endpoint Breach Triage",
        "objective": "Investigate PowerShell download cradle, dropped binary, and network C2 communication."
    }).json()
    case_id = case["id"]
    print(f"    Case Created: {case['name']} (ID: {case_id})")

    zip_path = Path("data/sample_evidence/incident_triage_bundle.zip")
    print(f"[2] Uploading real evidence bundle: {zip_path.name} ({zip_path.stat().st_size} bytes)...")
    with open(zip_path, "rb") as f:
        upload_resp = client.post(
            f"/api/cases/{case_id}/artifacts",
            files={"files": (zip_path.name, f, "application/zip")}
        )
    
    artifacts = upload_resp.json()
    print(f"    Ingested {len(artifacts)} artifact(s):")
    for a in artifacts:
        print(f"     - {a['original_filename']} | SHA256: {a['sha256'][:16]}... | Records: {a['record_count']} | Status: {a['parser_status']}")

    print("[3] Launching autonomous investigation agent...")
    inv = client.post(f"/api/cases/{case_id}/investigations", json={"mode": "deterministic"}).json()
    inv_id = inv["id"]
    print(f"    Investigation Launched: {inv_id}")

    print("[4] Monitoring autonomous agent reasoning...")
    for _ in range(12):
        time.sleep(1.5)
        st = client.get(f"/api/investigations/{inv_id}").json()
        print(f"    Step {st['steps_used']}/{st['max_steps']} | Status: {st['status']} | Actions executed: {len(st.get('actions', []))}")
        if st["status"] in ["completed", "stopped", "failed"]:
            break

    print("[5] Fetching verified findings...")
    findings = client.get(f"/api/cases/{case_id}/findings").json()
    print(f"    Total findings evaluated: {len(findings)}")
    for f in findings:
        print(f"     - [{f['status'].upper()}] {f['title']}")
        print(f"       Claim: {f['claim']}")
        if f.get("uncertainty_notes"):
            print(f"       Uncertainty: {f['uncertainty_notes']}")

    print("[6] Generating final forensic incident report...")
    report_text = client.get(f"/api/cases/{case_id}/report").text
    print(f"    Report Generated: {len(report_text)} characters")
    print("    Report Header:\n    " + report_text[:200].replace("\n", "\n    "))
    print("\n[+] Verification Complete! Ready for presentation.")

if __name__ == "__main__":
    main()
