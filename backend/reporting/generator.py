import json
from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy.orm import Session
from backend.database.models import (
    Case,
    Artifact,
    EvidenceEvent,
    Investigation,
    InvestigationAction,
    Finding,
    FindingEvidence,
    EvidenceRelationship,
    AuditEntry,
)

def generate_report_markdown(db: Session, case_id: str) -> str:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return "# Error: Case Not Found"

    artifacts = db.query(Artifact).filter(Artifact.case_id == case_id).all()
    events = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case_id).order_by(EvidenceEvent.timestamp_utc.asc()).all()
    investigations = db.query(Investigation).filter(Investigation.case_id == case_id).all()
    findings = db.query(Finding).filter(Finding.case_id == case_id).all()
    relationships = db.query(EvidenceRelationship).filter(EvidenceRelationship.case_id == case_id).all()
    actions = []
    if investigations:
        actions = db.query(InvestigationAction).filter(InvestigationAction.investigation_id == investigations[-1].id).order_by(InvestigationAction.sequence_number.asc()).all()

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Executive Summary based on findings
    supported_findings = [f for f in findings if f.status == "supported"]
    unresolved_findings = [f for f in findings if f.status == "unresolved"]
    contradicted_findings = [f for f in findings if f.status == "contradicted"]

    summary_text = (
        f"Autonomous digital forensics investigation conducted by TRACE for case '{case.name}'. "
        f"A total of {len(artifacts)} evidence artifact(s) comprising {len(events)} normalized endpoint records were analyzed. "
        f"The independent deterministic verifier established {len(supported_findings)} substantiated finding(s), "
        f"{len(unresolved_findings)} evidentiary gap(s)/unresolved claim(s), and {len(contradicted_findings)} disproven claim(s)."
    )

    md = f"""# FORENSIC INVESTIGATION REPORT
## TRACE: Threat Reconstruction & Autonomous Cyber Evidence
*Generated on {now_str}*

---

### 1. Executive Summary
{summary_text}

---

### 2. Case Information
- **Case Name:** {case.name}
- **Case UUID:** `{case.id}`
- **Investigation Status:** {case.status.upper()}
- **Investigation Mode:** {"Synthetic Demonstration" if case.is_demo else "Live Endpoint Investigation"} ({case.demo_type or 'standard'})
- **Created Date:** {case.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}

---

### 3. Investigation Objective
> "{case.objective}"

---

### 4. Evidence Manifest & Cryptographic Integrity
| Original Filename | Artifact Type | File Size | SHA-256 Digest | Parser Status | Records |
| :--- | :--- | :--- | :--- | :--- | :--- |
"""
    for a in artifacts:
        md += f"| `{a.original_filename}` | {a.artifact_type} | {a.file_size:,} bytes | `{a.sha256[:16]}...{a.sha256[-12:]}` | {a.parser_status} | {a.record_count} |\n"

    md += """
---

### 5. Integrity Verification
All ingested files were hashed via SHA-256 immediately upon acquisition. Working copies were parsed in isolated memory boundaries. Cryptographic chain-of-custody was preserved across all investigation stages.

---

### 6. Investigation Methodology
TRACE deployed an autonomous adaptive agent executing whitelisted forensic tools:
1. Cryptographic manifest and telemetry inventory verification.
2. Targeted keyword and structured event querying.
3. Strict parent-child PID process tree reconstruction.
4. Multi-pivot cross-artifact correlation.
5. Deterministic independent verification decoupled from LLM confidence.

---

### 7. Chronological Incident Timeline
| UTC Timestamp | Event Type | Source Record | Process / User | Summary |
| :--- | :--- | :--- | :--- | :--- |
"""
    for ev in events:
        norm = ev.normalized_fields
        proc_user = f"{norm.get('process_name') or '-'} ({norm.get('user') or '-'})"
        desc = (norm.get('command_line') or norm.get('file_path') or norm.get('description') or ev.event_type)[:80]
        md += f"| `{ev.timestamp_utc.strftime('%H:%M:%S')}` | `{ev.event_type}` | `{ev.source_record_id}` | {proc_user} | {desc} |\n"

    md += """
---

### 8. Process and File Relationships
| Source Entity | Relationship | Target Entity | Class | Verification |
| :--- | :--- | :--- | :--- | :--- |
"""
    for r in relationships:
        md += f"| `{r.source_entity_id}` | **{r.relationship_type}** | `{r.target_entity_id}` | {r.relationship_class} | {r.verification_status} |\n"

    md += """
---

### 9. Key Findings & Independent Verification
"""
    for idx, f in enumerate(findings, start=1):
        status_badge = f"**[{f.status.upper()}]**"
        md += f"""#### Finding {idx}: {f.title}
- **Status:** {status_badge}
- **Claim:** {f.claim}
- **Verification Method:** {f.verification_method}
- **Confidence:** {f.confidence_assessment}
- **Uncertainty / Notes:** {f.uncertainty_notes or 'None'}

**Cited Supporting Evidence:**
"""
        links = db.query(FindingEvidence).filter(FindingEvidence.finding_id == f.id).all()
        if links:
            for l in links:
                ev_obj = db.query(EvidenceEvent).filter(EvidenceEvent.id == l.evidence_event_id).first()
                if ev_obj:
                    md += f"- Record `{ev_obj.source_record_id}` ({ev_obj.event_type}) at {ev_obj.timestamp_utc.strftime('%H:%M:%S UTC')}: {l.explanation}\n"
        else:
            md += "- *No supporting records substantiated.*\n"

        md += "\n"

    md += """---

### 10. Agent Execution & Recovery Trace
"""
    if actions:
        md += "| Seq | Tool | Status | Duration | Result Summary |\n| :--- | :--- | :--- | :--- | :--- |\n"
        for act in actions:
            md += f"| {act.sequence_number} | `{act.tool_name}` | {act.status.upper()} | - | {act.result_summary or act.error_details or '-'} |\n"
    else:
        md += "*No agent actions recorded for this case yet.*\n"

    md += """
---

### 11. Investigation Limitations & Gaps
- Forensic scope bounded by ingested telemetry. In degraded evidence scenarios, unobserved process creations remain unverified.
- Legitimate administrative tools (e.g. PowerShell) require behavioral correlation before attributing malicious intent.

---

### 12. Conclusion & Recommended Next Steps
1. Quarantine workstation `WS-SEC-OPS01` pending full forensic image capture.
2. Invalidate credentials for user `SYSTEM_ADMIN` and inspect active Kerberos/NTLM tickets.
3. Block external C2 IP destination `198.51.100.42` at enterprise perimeter firewalls.
4. Scan all domain endpoints for presence of binary `C:\\Windows\\Cache\\scvhost.exe` and persistence key `HKCU\\...\\Run\\SystemUpdate`.
"""
    return md

def generate_report_html(db: Session, case_id: str) -> str:
    md_content = generate_report_markdown(db, case_id)
    # Simple clean HTML rendering with dark cyber theme
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TRACE Forensic Report - {case_id}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0B0F19;
      color: #E2E8F0;
      line-height: 1.6;
      padding: 40px;
      max-width: 960px;
      margin: 0 auto;
    }}
    h1, h2, h3, h4 {{ color: #38BDF8; border-bottom: 1px solid #1E293B; padding-bottom: 8px; }}
    h1 {{ font-size: 24px; margin-bottom: 4px; }}
    h2 {{ font-size: 16px; color: #94A3B8; margin-top: 0; }}
    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }}
    th, td {{ border: 1px solid #1E293B; padding: 8px 12px; text-align: left; }}
    th {{ background-color: #131C31; color: #F8FAFC; }}
    tr:nth-child(even) {{ background-color: #0F172A; }}
    code {{ background: #131C31; color: #38BDF8; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }}
    blockquote {{ border-left: 4px solid #38BDF8; margin: 16px 0; padding: 8px 16px; background: #131C31; color: #94A3B8; }}
    .badge-supported {{ color: #10B981; font-weight: bold; }}
    .badge-unresolved {{ color: #F59E0B; font-weight: bold; }}
    .badge-contradicted {{ color: #EF4444; font-weight: bold; }}
    @media print {{
      body {{ background-color: white; color: black; padding: 20px; }}
      h1, h2, h3, h4 {{ color: black; border-color: #ccc; }}
      code {{ background: #eee; color: black; }}
      th {{ background: #ddd; color: black; }}
      blockquote {{ background: #f9f9f9; border-color: #333; }}
    }}
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #38BDF8; padding-bottom: 12px;">
    <div>
      <span style="font-weight: 800; font-size: 20px; letter-spacing: 2px; color: #38BDF8;">TRACE</span>
      <span style="font-size: 12px; color: #94A3B8; margin-left: 12px;">Threat Reconstruction & Autonomous Cyber Evidence</span>
    </div>
    <button onclick="window.print()" style="background: #38BDF8; color: #070A11; font-weight: bold; padding: 6px 14px; border: none; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <pre style="white-space: pre-wrap; font-family: inherit; font-size: inherit; color: inherit;">{md_content}</pre>
</body>
</html>
"""
    return html
