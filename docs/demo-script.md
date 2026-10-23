# TRACE Judge Demonstration Script

Follow this step-by-step walkthrough to evaluate TRACE in 5 minutes with zero setup or API keys.

---

### Step 1: Open the Application
- Open `http://localhost:3000` in the browser.
- You will see the **Overview Dashboard** with the title: *"Don't just detect. Investigate, verify, explain."*
- Notice the **"OFFLINE DEMO READY · NO API KEY REQUIRED"** status badge in the top bar.

---

### Step 2: Launch the Demonstration Investigation
- Click the prominent **"Run Demo Investigation"** (or **"Run Complete Demo (Case A)"**) button on the dashboard.
- TRACE initializes the synthetic PowerShell incident:
  - Seeds the case into SQLite.
  - Generates the forensic evidence artifact `security_sysmon_bundle.json`.
  - Calculates its cryptographic SHA-256 digest.
  - Launches the single adaptive investigation agent.
- You are automatically routed to the **Live Investigation Center** (`/investigations/[id]`).

---

### Step 3: Observe the Single Adaptive Agent Live
- Watch the **Live Trace** center panel stream real-time events via Server-Sent Events (SSE):
  1. `inspect_case`: Assesses manifest, SHA-256 integrity, and cataloged telemetry.
  2. `query_events`: Discovers suspicious PowerShell execution (`powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ...`).
  3. `trace_process`: Reconstructs parent-child lineage: `explorer.exe` (3420) &rarr; `cmd.exe` (4820) &rarr; `powershell.exe` (5912).
  4. `query_events`: Inspects file activity; finds `C:\Windows\Cache\scvhost.exe` dropped by `powershell.exe`.
  5. `correlate_artifacts`: Connects user `SYSTEM_ADMIN`, payload dropping, network socket to `198.51.100.42:443`, and Run key persistence.
  6. `verify_claim`: Submits claims to the independent deterministic verifier.
- Notice how the **Current Hypothesis** in the left panel updates dynamically as new evidence is acquired.

---

### Step 4: Inject a Real Tool Failure
- In the left panel, click **"Inject Tool Failure (Demo Control)"**.
- Select **"Endpoint Query Connection Failure (ECONNRESET)"** and click **"Arm Failure Injection"**.
- Watch the agent encounter the real failure:
  - It records the error diagnostic.
  - Attempts bounded idempotent retry.
  - Upon exceeding retry budget, emits a `replanned` event and seamlessly switches to an alternative approved tool.

---

### Step 5: Test Independent Verification & Source Provenance
- In the right panel, observe the **Independent Verification** findings list:
  - Finding 1: *"Unauthorized Payload Dropped via PowerShell"* &rarr; Status: **`[SUPPORTED]`** (Restrained Green).
- Click on the finding card:
  - Inspect the verification proof and cited evidence records.
  - Click on **Record #REC-00105**:
  - The **Forensic Source Record Inspector** drawer slides out from the right, showing:
    - Primary source record ID
    - Normalized fields (Process, File path, User context)
    - Original UTC timestamp and timezone metadata
    - Cryptographic record SHA-256 source hash

---

### Step 6: Explore Incident Visualizations
Switch between the tabs above the center panel:
- **Timeline**: Filter chronologically by user, process, or event type.
- **Process Tree**: View observed executions vs missing parent gaps.
- **Evidence Graph**: Interact with the React Flow node-link graph connecting users, processes, files, and verified claims.

---

### Step 7: Export the Verifiable Incident Report
- Click **"Export Report"** in the top right.
- A comprehensive forensic incident report opens in standalone HTML format with:
  - Executive summary
  - Evidence manifest with SHA-256 digests
  - Unified timeline
  - Verified findings citing stable source record IDs
  - Ready to print or save to PDF with one click.

---

### Step 8: Compare with Degraded Evidence (Case B)
- Return to the Overview Dashboard (`/`).
- Click **"Run Degraded Evidence Demo (Case B)"**.
- In Case B, the child process creation log (EID 4688) for `scvhost.exe` was intentionally omitted from the evidence bundle.
- Watch the independent verifier reject the direct execution claim, classifying it as **`[UNRESOLVED]`** with explicit evidentiary gap notes:
  > *"Missing process creation telemetry: File write and network connection observed, but direct process launch cannot be substantiated without process creation telemetry."*
- Proves that TRACE **does not hallucinate findings** when required evidence is missing.
