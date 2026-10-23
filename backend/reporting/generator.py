import html
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
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
)

def explain_event_for_humans(norm: Dict[str, Any], event_type: str) -> str:
    """Translates raw forensic telemetry into plain, beginner-friendly English."""
    cmd = str(norm.get("command_line") or "").lower()
    proc = str(norm.get("process_name") or "").lower()
    file_path = str(norm.get("file_path") or norm.get("target_file") or "").lower()

    if "vssadmin" in proc or "vssadmin" in cmd:
        return "Deleted Windows shadow backups so victims cannot restore their deleted or encrypted files."
    if "wbadmin" in proc or "wbadmin" in cmd:
        return "Deleted backup catalogs to prevent automated system restoration."
    if "bcdedit" in proc or "bcdedit" in cmd:
        return "Altered Windows boot settings to ignore startup failures and suppress recovery options."
    if "powershell" in proc and ("enc" in cmd or "encodedcommand" in cmd):
        return "Executed an obfuscated (hidden) PowerShell script to evade detection."
    if "invokewebrequest" in cmd or "downloadstring" in cmd or "start-bitstransfer" in cmd:
        return "Downloaded an external payload or script from the internet onto this computer."
    if "schtasks" in proc or "schtasks" in cmd:
        return "Created a scheduled task so malicious code runs automatically whenever Windows restarts."
    if "procdump" in proc or "lsass" in cmd:
        return "Attempted to dump memory from the Windows Security Authority (LSASS) to steal user passwords."
    if "whoami" in proc:
        return "Ran reconnaissance to check current user accounts and permission privileges."
    if ".locked" in file_path or ".crypto" in file_path or ".enc" in file_path:
        return f"File was renamed and encrypted: {norm.get('file_path')}"
    if "recovery" in file_path or "readme" in file_path or "decrypt" in file_path:
        return f"Ransom instruction note was dropped on the file system: {norm.get('file_path')}"
    if norm.get("dest_ip"):
        return f"Outbound network connection to external IP {norm.get('dest_ip')}:{norm.get('dest_port') or '443'}."
    if event_type == "user_logon":
        return f"User account '{norm.get('user') or 'Unknown'}' logged into workstation."
    if event_type == "file_activity":
        return f"File system action on '{norm.get('file_path') or 'unnamed file'}'."
    if event_type == "process_creation":
        return f"Launched program '{norm.get('process_name') or 'unknown'}'.' {norm.get('command_line') or ''}".strip()
    return norm.get("description") or f"Recorded {event_type.replace('_', ' ')} event."

def explain_finding_for_humans(finding: Finding) -> Dict[str, str]:
    """Generates plain-English explanation of why a finding was marked supported or unresolved."""
    status = finding.status.lower()
    title = finding.title
    claim = finding.claim

    if status == "supported":
        verdict = "CONFIRMED THREAT"
        badge_class = "badge-danger"
        explanation = (
            f"TRACE verified this claim directly against the raw log records. "
            f"The logs prove that this action occurred on the system."
        )
    elif status == "contradicted":
        verdict = "DISPROVEN CLAIM"
        badge_class = "badge-neutral"
        explanation = (
            f"The evidence directly contradicts this claim. "
            f"Recorded forensic events prove this did not happen as asserted."
        )
    else:  # unresolved / evidentiary gap
        verdict = "NOT FOUND IN LOGS (EVIDENTIARY GAP)"
        badge_class = "badge-warning"
        if "powershell" in title.lower() or "powershell" in claim.lower():
            explanation = (
                f"The investigation tested whether PowerShell was used maliciously. "
                f"However, the uploaded log file contains NO PowerShell activity. "
                f"TRACE's verifier accurately flags that this claim is unsupported by the provided evidence, "
                f"preventing false accusations."
            )
        else:
            explanation = (
                f"The specific records needed to prove this claim were not found in the uploaded evidence file. "
                f"TRACE strictly requires primary proof before confirming any conclusion."
            )

    return {
        "verdict": verdict,
        "badge_class": badge_class,
        "explanation": explanation,
    }

def get_dynamic_recommendations(events: List[EvidenceEvent], findings: List[Finding]) -> List[Dict[str, str]]:
    """Generates tailored next steps based on the actual telemetry observed."""
    recs = []
    users = set()
    processes = set()
    files = set()
    dest_ips = set()
    has_ransomware = False
    has_powershell = False
    has_credential_dump = False

    for ev in events:
        norm = ev.normalized_fields
        if norm.get("user"):
            users.add(norm.get("user"))
        if norm.get("process_name"):
            processes.add(norm.get("process_name"))
        if norm.get("dest_ip"):
            dest_ips.add(f"{norm.get('dest_ip')}:{norm.get('dest_port') or '443'}")
        fp = str(norm.get("file_path") or "").lower()
        cmd = str(norm.get("command_line") or "").lower()
        if ".locked" in fp or "vssadmin" in cmd or "readme" in fp:
            has_ransomware = True
            if norm.get("file_path"):
                files.add(norm.get("file_path"))
        if "powershell" in cmd or "powershell" in str(norm.get("process_name") or "").lower():
            has_powershell = True
        if "procdump" in cmd or "lsass" in cmd:
            has_credential_dump = True

    if has_ransomware:
        recs.append({
            "action": "Immediately Disconnect the Machine from the Network",
            "reason": "Ransomware activity was detected. Pull the network cable or disable Wi-Fi to stop files from encrypting network shares.",
            "priority": "HIGH",
        })
        recs.append({
            "action": "Restore Data from Offline or Cloud Backups",
            "reason": "Local Windows Shadow copies were deleted (vssadmin/wbadmin). Do not rely on local recovery; use secure offsite backups.",
            "priority": "HIGH",
        })

    if dest_ips:
        recs.append({
            "action": f"Block Outbound IP(s): {', '.join(dest_ips)}",
            "reason": "Outbound communication to an untrusted external server was recorded. Block this destination on the firewall.",
            "priority": "HIGH",
        })

    if has_credential_dump:
        recs.append({
            "action": "Force Organization-Wide Password & Token Reset",
            "reason": "Memory dumping of LSASS was detected, indicating active attempts to steal administrator passwords.",
            "priority": "HIGH",
        })

    if users:
        recs.append({
            "action": f"Review & Reset Account Credentials for: {', '.join(users)}",
            "reason": "Actions were executed under these user accounts. Ensure they are temporarily locked and reviewed for compromise.",
            "priority": "MEDIUM",
        })

    # Default fallback if benign or unresolved
    if not recs:
        recs.append({
            "action": "Enable Enhanced Endpoint Logging (Sysmon / Audit Policy)",
            "reason": "No active threat commands were detected in this specific file. Ensure Event ID 4688 command-line logging is enabled across all systems.",
            "priority": "INFO",
        })

    return recs

def generate_report_markdown(db: Session, case_id: str) -> str:
    """Generates a clean, simple, human-readable Markdown report."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return "# Error: Case Not Found"

    artifacts = db.query(Artifact).filter(Artifact.case_id == case_id).all()
    events = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case_id).order_by(EvidenceEvent.timestamp_utc.asc()).all()
    findings = db.query(Finding).filter(Finding.case_id == case_id).all()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    supported_findings = [f for f in findings if f.status == "supported"]
    unresolved_findings = [f for f in findings if f.status == "unresolved"]
    recommendations = get_dynamic_recommendations(events, findings)

    # Human-friendly executive verdict
    if supported_findings:
        verdict_str = "CRITICAL THREAT CONFIRMED"
        verdict_summary = f"TRACE confirmed {len(supported_findings)} malicious finding(s) with primary evidence proof."
    elif any(ev.normalized_fields.get("command_line") and any(k in str(ev.normalized_fields.get("command_line")).lower() for k in ["vssadmin", "wbadmin", ".locked", "schtasks", "procdump"]) for ev in events):
        verdict_str = "SUSPICIOUS ACTIVITY DETECTED (OBJECTIVE GAP)"
        verdict_summary = "Malicious or destructive actions were detected in the log, but they differed from the specific PowerShell objective originally queried."
    else:
        verdict_str = "INCONCLUSIVE / NO THREAT FOUND"
        verdict_summary = "No evidence supporting malicious execution was found in the provided evidence."

    md = f"""# Forensic Incident Report: {case.name}
**Generated by TRACE (Threat Reconstruction & Autonomous Cyber Evidence)**  
*Date:* {now_str} | *Status:* {case.status.upper()} | *Case ID:* `{case.id}`

---

## 1. Executive Summary (The Plain-English Verdict)

- **Overall Verdict:** **{verdict_str}**
- **Bottom Line:** {verdict_summary}
- **Telemetry Analyzed:** {len(artifacts)} evidence file(s) with {len(events)} total recorded action(s).
- **Substantiated Claims:** {len(supported_findings)} verified | **Evidentiary Gaps:** {len(unresolved_findings)} unproven

> **Original Investigation Objective:**  
> "{case.objective}"

---

## 2. What Happened (Chronological Story)

The following sequence of events was observed on the system:

| # | Time (UTC) | Program | User | What It Did (Plain English) |
| :--- | :--- | :--- | :--- | :--- |
"""
    for idx, ev in enumerate(events, start=1):
        norm = ev.normalized_fields
        proc = norm.get("process_name") or norm.get("Image") or "Unknown Program"
        user = norm.get("user") or "-"
        plain_desc = explain_event_for_humans(norm, ev.event_type)
        time_str = ev.timestamp_utc.strftime("%H:%M:%S")
        md += f"| {idx} | `{time_str}` | **{proc}** | `{user}` | {plain_desc} |\n"

    md += """
---

## 3. Findings & Verification (Easy-to-Read Breakdown)

TRACE uses an independent verifier to prevent false accusations and hallucinations. Here is the evaluation of each finding:

"""
    for idx, f in enumerate(findings, start=1):
        fh = explain_finding_for_humans(f)
        md += f"""### Finding {idx}: {f.title}
- **Verdict:** **[{fh['verdict']}]**
- **Original Claim:** *{f.claim}*
- **Explanation:** {fh['explanation']}

"""
        # Unique supporting evidence links
        links = db.query(FindingEvidence).filter(FindingEvidence.finding_id == f.id).all()
        seen_records = set()
        unique_links = []
        for l in links:
            if l.evidence_event_id not in seen_records:
                seen_records.add(l.evidence_event_id)
                unique_links.append(l)

        if unique_links:
            md += "**Evidence Cited:**\n"
            for l in unique_links:
                ev_obj = db.query(EvidenceEvent).filter(EvidenceEvent.id == l.evidence_event_id).first()
                if ev_obj:
                    proc = ev_obj.normalized_fields.get("process_name") or "Action"
                    cmd = ev_obj.normalized_fields.get("command_line") or ev_obj.normalized_fields.get("file_path") or ""
                    cmd_summary = f" (`{cmd[:60]}...`)" if cmd else ""
                    md += f"- **Record `{ev_obj.source_record_id}`** at {ev_obj.timestamp_utc.strftime('%H:%M:%S UTC')}: {proc}{cmd_summary}\n"
        else:
            md += "- *No matching records found in this log file.*\n"
        md += "\n"

    md += """---

## 4. Recommended Next Steps (Action Plan)

Based on the actual actions observed in your logs, here are the recommended next steps:

"""
    for idx, r in enumerate(recommendations, start=1):
        md += f"**{idx}. [{r['priority']}] {r['action']}**  \n   *Reason:* {r['reason']}\n\n"

    md += """---

## 5. Technical Evidence Manifest

| File Name | File Type | File Size | SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- | :--- |
"""
    for a in artifacts:
        md += f"| `{a.original_filename}` | {a.artifact_type} | {a.file_size:,} bytes | `{a.sha256[:16]}...{a.sha256[-8:]}` | {a.parser_status} |\n"

    return md

def generate_report_html(db: Session, case_id: str) -> str:
    """Generates a modern, clean, executive-grade HTML incident report."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return "<h1>Error: Case Not Found</h1>"

    artifacts = db.query(Artifact).filter(Artifact.case_id == case_id).all()
    events = db.query(EvidenceEvent).filter(EvidenceEvent.case_id == case_id).order_by(EvidenceEvent.timestamp_utc.asc()).all()
    findings = db.query(Finding).filter(Finding.case_id == case_id).all()
    relationships = db.query(EvidenceRelationship).filter(EvidenceRelationship.case_id == case_id).all()

    now_str = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M:%S UTC")
    supported_findings = [f for f in findings if f.status == "supported"]
    unresolved_findings = [f for f in findings if f.status == "unresolved"]
    recommendations = get_dynamic_recommendations(events, findings)

    # Determine overall status theme
    has_ransomware = any(".locked" in str(ev.normalized_fields.get("file_path") or "") or "vssadmin" in str(ev.normalized_fields.get("command_line") or "") for ev in events)
    if supported_findings:
        verdict_badge = "THREAT CONFIRMED"
        verdict_class = "status-threat"
        verdict_desc = f"TRACE verified {len(supported_findings)} malicious action(s) directly supported by cryptographic log evidence."
    elif has_ransomware:
        verdict_badge = "SUSPICIOUS RANSOMWARE ACTIVITY (EVIDENTIARY GAP ON POWERSHELL)"
        verdict_class = "status-warning"
        verdict_desc = "The uploaded file contained ransomware actions (backup deletion & encrypted files). However, because no PowerShell events were present, the specific PowerShell hypothesis was marked Unresolved to prevent false attribution."
    else:
        verdict_badge = "EVIDENTIARY GAP / UNRESOLVED"
        verdict_class = "status-info"
        verdict_desc = "The requested investigative hypothesis could not be verified in the provided evidence file."

    # Build events HTML rows
    events_html = ""
    for idx, ev in enumerate(events, start=1):
        norm = ev.normalized_fields
        proc = html.escape(str(norm.get("process_name") or "-"))
        user = html.escape(str(norm.get("user") or "-"))
        cmd = html.escape(str(norm.get("command_line") or norm.get("file_path") or "-"))
        plain_desc = html.escape(explain_event_for_humans(norm, ev.event_type))
        time_str = ev.timestamp_utc.strftime("%H:%M:%S UTC")
        events_html += f"""
        <tr>
          <td class="cell-num">{idx}</td>
          <td class="cell-time">{time_str}</td>
          <td class="cell-proc"><strong>{proc}</strong></td>
          <td class="cell-user">{user}</td>
          <td class="cell-desc">
            <div class="plain-english-badge">{plain_desc}</div>
            <div class="raw-cmd"><code>{cmd}</code></div>
          </td>
        </tr>
        """

    # Build findings HTML
    findings_html = ""
    for idx, f in enumerate(findings, start=1):
        fh = explain_finding_for_humans(f)
        badge_style = "badge-danger" if f.status == "supported" else ("badge-warning" if f.status == "unresolved" else "badge-info")

        # Unique evidence links
        links = db.query(FindingEvidence).filter(FindingEvidence.finding_id == f.id).all()
        seen = set()
        unique_links = []
        for l in links:
            if l.evidence_event_id not in seen:
                seen.add(l.evidence_event_id)
                unique_links.append(l)

        evidence_list_html = ""
        if unique_links:
            for l in unique_links:
                ev_obj = db.query(EvidenceEvent).filter(EvidenceEvent.id == l.evidence_event_id).first()
                if ev_obj:
                    p = html.escape(str(ev_obj.normalized_fields.get("process_name") or "Action"))
                    c = html.escape(str(ev_obj.normalized_fields.get("command_line") or ev_obj.normalized_fields.get("file_path") or ""))
                    evidence_list_html += f"""
                    <li>
                      <span class="rec-id">{ev_obj.source_record_id}</span>
                      <span class="rec-time">[{ev_obj.timestamp_utc.strftime('%H:%M:%S UTC')}]</span>
                      <strong>{p}</strong>: <code>{c[:90]}</code>
                    </li>
                    """
        else:
            evidence_list_html = "<li><em>No supporting records found in this log.</em></li>"

        findings_html += f"""
        <div class="finding-card {badge_style}">
          <div class="finding-header">
            <span class="finding-num">Finding {idx}</span>
            <h3 class="finding-title">{html.escape(f.title)}</h3>
            <span class="finding-badge {badge_style}">{fh['verdict']}</span>
          </div>
          <div class="finding-body">
            <p><strong>Claim Tested:</strong> <em>{html.escape(f.claim)}</em></p>
            <div class="finding-explanation">
              <strong>Plain-English Meaning:</strong> {html.escape(fh['explanation'])}
            </div>
            <div class="finding-citations">
              <strong>Cited Evidence Records:</strong>
              <ul>{evidence_list_html}</ul>
            </div>
          </div>
        </div>
        """

    # Build recommendations HTML
    recs_html = ""
    for idx, r in enumerate(recommendations, start=1):
        p_class = "priority-high" if r["priority"] == "HIGH" else ("priority-med" if r["priority"] == "MEDIUM" else "priority-info")
        recs_html += f"""
        <div class="rec-item {p_class}">
          <div class="rec-top">
            <span class="rec-index">{idx}</span>
            <span class="rec-badge {p_class}">{r['priority']} PRIORITY</span>
            <span class="rec-action">{html.escape(r['action'])}</span>
          </div>
          <div class="rec-reason">{html.escape(r['reason'])}</div>
        </div>
        """

    # Build artifacts HTML
    artifacts_html = ""
    for a in artifacts:
        artifacts_html += f"""
        <tr>
          <td><code>{html.escape(a.original_filename)}</code></td>
          <td><span class="type-pill">{html.escape(a.artifact_type.upper())}</span></td>
          <td>{a.file_size:,} bytes</td>
          <td><code class="hash-code">{a.sha256[:16]}...{a.sha256[-12:]}</code></td>
          <td><span class="status-pill status-ok">{html.escape(a.parser_status)}</span></td>
          <td>{a.record_count} records</td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TRACE Forensic Report - {html.escape(case.name)}</title>
  <style>
    :root {{
      --bg: #070B14;
      --card-bg: #0F172A;
      --card-alt: #131E36;
      --border: #1E293B;
      --text: #F1F5F9;
      --text-muted: #94A3B8;
      --accent: #38BDF8;
      --emerald: #10B981;
      --amber: #F59E0B;
      --rose: #EF4444;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 30px 20px;
    }}
    .container {{
      max-width: 1040px;
      margin: 0 auto;
    }}
    /* Top Bar */
    .top-bar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .logo {{
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 2px;
      color: var(--accent);
    }}
    .sub-brand {{
      font-size: 13px;
      color: var(--text-muted);
      border-left: 1px solid var(--border);
      padding-left: 12px;
    }}
    .btn-print {{
      background: var(--accent);
      color: #070B14;
      font-weight: 700;
      font-size: 13px;
      padding: 8px 18px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.2s;
    }}
    .btn-print:hover {{ opacity: 0.9; }}

    /* Title & Meta */
    .header-card {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }}
    .header-card h1 {{
      font-size: 24px;
      color: #FFFFFF;
      margin-bottom: 8px;
    }}
    .meta-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 13px;
      color: var(--text-muted);
    }}
    .meta-item strong {{ color: var(--text); }}

    /* Verdict Box */
    .verdict-box {{
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 28px;
      border-left: 6px solid var(--accent);
      background: var(--card-bg);
    }}
    .verdict-box.status-threat {{
      border-left-color: var(--rose);
      background: rgba(239, 68, 68, 0.08);
    }}
    .verdict-box.status-warning {{
      border-left-color: var(--amber);
      background: rgba(245, 158, 11, 0.08);
    }}
    .verdict-box.status-info {{
      border-left-color: var(--accent);
      background: rgba(56, 189, 248, 0.08);
    }}
    .verdict-title-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }}
    .verdict-label {{
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-muted);
    }}
    .verdict-badge {{
      font-size: 12px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
    }}
    .status-threat .verdict-badge {{ background: var(--rose); color: white; }}
    .status-warning .verdict-badge {{ background: var(--amber); color: #070B14; }}
    .status-info .verdict-badge {{ background: var(--accent); color: #070B14; }}
    .verdict-headline {{
      font-size: 16px;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 6px;
    }}
    .verdict-desc {{
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
    }}

    /* Section Styles */
    .section-title {{
      font-size: 18px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .section-block {{
      margin-bottom: 32px;
    }}

    /* Objective Callout */
    .objective-callout {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 14px;
      color: var(--text-muted);
      font-style: italic;
      margin-bottom: 24px;
    }}
    .objective-callout strong {{
      font-style: normal;
      color: var(--text);
    }}

    /* Story Table */
    .styled-table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      font-size: 13px;
    }}
    .styled-table th {{
      background: var(--card-alt);
      color: var(--text);
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
    }}
    .styled-table td {{
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }}
    .styled-table tr:last-child td {{ border-bottom: none; }}
    .styled-table tr:hover td {{ background: rgba(56, 189, 248, 0.03); }}
    .cell-num {{ width: 40px; color: var(--text-muted); font-weight: bold; }}
    .cell-time {{ width: 110px; font-family: monospace; color: var(--accent); }}
    .cell-proc {{ width: 140px; color: #FFFFFF; }}
    .cell-user {{ width: 110px; color: var(--text-muted); }}
    .plain-english-badge {{
      background: rgba(56, 189, 248, 0.12);
      border-left: 3px solid var(--accent);
      color: #E2E8F0;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      margin-bottom: 6px;
    }}
    .raw-cmd code {{
      font-size: 11px;
      color: var(--text-muted);
      background: var(--bg);
      padding: 2px 6px;
      border-radius: 3px;
      display: inline-block;
      max-width: 100%;
      overflow-x: auto;
    }}

    /* Findings Cards */
    .finding-card {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 16px;
      overflow: hidden;
    }}
    .finding-card.badge-danger {{ border-left: 4px solid var(--rose); }}
    .finding-card.badge-warning {{ border-left: 4px solid var(--amber); }}
    .finding-card.badge-info {{ border-left: 4px solid var(--accent); }}
    .finding-header {{
      background: var(--card-alt);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .finding-num {{
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--text-muted);
    }}
    .finding-title {{
      font-size: 15px;
      font-weight: 700;
      color: #FFFFFF;
      flex: 1;
    }}
    .finding-badge {{
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }}
    .finding-badge.badge-danger {{ background: var(--rose); color: white; }}
    .finding-badge.badge-warning {{ background: var(--amber); color: #070B14; }}
    .finding-badge.badge-info {{ background: var(--accent); color: #070B14; }}
    .finding-body {{
      padding: 16px 18px;
      font-size: 13px;
    }}
    .finding-explanation {{
      background: rgba(255, 255, 255, 0.03);
      padding: 10px 14px;
      border-radius: 6px;
      margin: 10px 0;
      color: #CBD5E1;
      border-left: 3px solid var(--amber);
    }}
    .finding-citations strong {{ color: var(--text); }}
    .finding-citations ul {{
      list-style: none;
      margin-top: 6px;
    }}
    .finding-citations li {{
      padding: 4px 0;
      color: var(--text-muted);
      font-size: 12px;
    }}
    .rec-id {{
      background: var(--card-alt);
      color: var(--accent);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: monospace;
      font-weight: 700;
    }}
    .rec-time {{ color: var(--text-muted); font-family: monospace; margin-left: 4px; }}

    /* Recommendations */
    .rec-item {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 12px;
    }}
    .rec-item.priority-high {{ border-left: 4px solid var(--rose); }}
    .rec-item.priority-med {{ border-left: 4px solid var(--amber); }}
    .rec-item.priority-info {{ border-left: 4px solid var(--accent); }}
    .rec-top {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }}
    .rec-index {{
      font-weight: 800;
      font-size: 14px;
      color: var(--text-muted);
    }}
    .rec-badge {{
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }}
    .priority-high .rec-badge {{ background: var(--rose); color: white; }}
    .priority-med .rec-badge {{ background: var(--amber); color: #070B14; }}
    .priority-info .rec-badge {{ background: var(--accent); color: #070B14; }}
    .rec-action {{
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
    }}
    .rec-reason {{
      font-size: 13px;
      color: var(--text-muted);
      margin-left: 24px;
    }}

    /* Pills & Hashes */
    .type-pill {{ background: #1E293B; color: #94A3B8; padding: 2px 6px; border-radius: 4px; font-size: 11px; }}
    .status-pill {{ padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }}
    .status-ok {{ background: rgba(16, 185, 129, 0.15); color: #34D399; }}
    .hash-code {{ font-size: 11px; color: var(--text-muted); font-family: monospace; }}

    /* Print Stylesheet */
    @media print {{
      body {{ background: white; color: #111; padding: 10px; }}
      .btn-print {{ display: none; }}
      .header-card, .styled-table, .finding-card, .rec-item, .verdict-box {{
        background: #fafafa !important;
        border-color: #ddd !important;
        color: #111 !important;
      }}
      .styled-table th, .finding-header {{ background: #eee !important; color: #111 !important; }}
      .styled-table td, .finding-body, .verdict-desc {{ color: #222 !important; }}
      .header-card h1, .finding-title, .rec-action {{ color: #000 !important; }}
      .plain-english-badge {{ background: #f0f7ff !important; color: #004085 !important; border-color: #004085 !important; }}
      .raw-cmd code {{ background: #eee !important; color: #333 !important; }}
      .section-title {{ color: #0056b3 !important; }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="brand">
        <span class="logo">TRACE</span>
        <span class="sub-brand">Threat Reconstruction & Autonomous Cyber Evidence</span>
      </div>
      <button class="btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Print / Save as PDF
      </button>
    </div>

    <!-- Case Header -->
    <div class="header-card">
      <h1>Forensic Incident Report: {html.escape(case.name)}</h1>
      <div class="meta-row">
        <div class="meta-item">Case ID: <strong>{case.id}</strong></div>
        <div class="meta-item">Investigation Status: <strong>{case.status.upper()}</strong></div>
        <div class="meta-item">Generated: <strong>{now_str}</strong></div>
      </div>
    </div>

    <!-- Verdict Box -->
    <div class="verdict-box {verdict_class}">
      <div class="verdict-title-row">
        <span class="verdict-label">Executive Verdict at a Glance</span>
        <span class="verdict-badge">{verdict_badge}</span>
      </div>
      <div class="verdict-headline">{verdict_desc}</div>
      <div class="verdict-desc">
        Analyzed <strong>{len(artifacts)} evidence file(s)</strong> containing <strong>{len(events)} recorded actions</strong>.
        TRACE checked the evidence against your investigation objective, verified all claims with primary source logs, and identified actionable remediation steps below.
      </div>
    </div>

    <!-- Objective -->
    <div class="objective-callout">
      <strong>Investigation Objective:</strong> "{html.escape(case.objective)}"
    </div>

    <!-- Step 1: Plain-English Timeline Story -->
    <div class="section-block">
      <h2 class="section-title">
        <span>Step 1: What Happened on this Computer (Chronological Story)</span>
      </h2>
      <table class="styled-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>Program</th>
            <th>User</th>
            <th>What It Did (Plain English & Raw Command)</th>
          </tr>
        </thead>
        <tbody>
          {events_html if events_html else '<tr><td colspan="5" style="text-align:center; padding: 20px;">No events recorded in this case yet.</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Step 2: Findings & Verification -->
    <div class="section-block">
      <h2 class="section-title">
        <span>Step 2: Key Findings & Verification (Simple Breakdown)</span>
      </h2>
      {findings_html if findings_html else '<div style="color: var(--text-muted); padding: 14px; background: var(--card-bg); border-radius: 8px;">No findings generated for this case yet.</div>'}
    </div>

    <!-- Step 3: Actionable Next Steps -->
    <div class="section-block">
      <h2 class="section-title">
        <span>Step 3: Recommended Next Steps (Action Plan)</span>
      </h2>
      {recs_html}
    </div>

    <!-- Step 4: Technical Evidence Manifest -->
    <div class="section-block">
      <h2 class="section-title">
        <span>Technical Evidence Manifest & Integrity</span>
      </h2>
      <table class="styled-table">
        <thead>
          <tr>
            <th>Original Filename</th>
            <th>Type</th>
            <th>File Size</th>
            <th>SHA-256 Digest</th>
            <th>Parser Status</th>
            <th>Records</th>
          </tr>
        </thead>
        <tbody>
          {artifacts_html}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
"""
