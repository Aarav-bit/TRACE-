# TRACE — Threat Reconstruction & Autonomous Cyber Evidence
### Autonomous Digital Forensics & Endpoint Incident Investigator

> **Tagline:** Don't just detect. Investigate, verify, explain.

---

## 1. Executive Overview

Most AI security tools summarize alerts or suggest generic bash commands. **TRACE performs the incident investigation itself.**

An investigator provides forensic evidence (Windows EVTX, Sysmon JSON/CSV logs, or ZIP bundles) and defines a high-level objective. TRACE plans an investigation, invokes approved forensic tools, follows leads, adapts when a query fails or evidence is missing, verifies every claim against source records, and generates a cryptographic incident report that a human investigator can independently audit.

### The Core Innovation
A **single adaptive investigation agent** that coordinates deterministic forensic tools and independently validates its own conclusions against primary source logs before asserting them.

---

## 2. Key Capabilities & Features

1. **Persistent Full-Stack Workspace**: Complete Next.js App Router frontend with dark cybersecurity interface (slate panels, cool blue accents, restrained green for verified findings, amber for uncertainty).
2. **Deterministic Offline Demo (No API Keys Required)**: Works 100% out of the box with zero external dependencies or paid accounts.
3. **Single Adaptive Investigation Agent**: Dynamic bounded control loop that updates hypotheses, classifies errors, and replans actions based on real tool results.
4. **Real Failure Recovery**: Simulated failure-injection controls (Connection resets, timeouts, corrupted streams) trigger real backend recovery, bounded idempotent retries, and tool substitution.
5. **Independent Deterministic Verifier**: Verifies claims against actual database record IDs and ground-truth criteria. Rejects unsupported causal claims (e.g. In degraded evidence scenarios).
6. **Multi-Pivot Forensic Visualizations**:
   - **Live Trace**: Real-time Server-Sent Events (SSE) stream showing why each tool was chosen, parameters, status, and raw results.
   - **Incident Timeline**: Chronological event list normalized to UTC with preserved timezone provenance.
   - **Process Tree**: Distinguishes observed executions (EID 4688) from inferred telemetry and unobserved parent gaps.
   - **Evidence Graph**: Interactive React Flow graph connecting processes, users, files, and findings.
   - **Findings Browser**: Structured claims with clickable source record provenance.
7. **Complete Evidence Integrity**: SHA-256 hashing upon acquisition, read-only original preservation, Zip-Slip path traversal defense, and append-only audit hash chaining.
8. **Exportable Incident Reports**: Comprehensive Markdown and standalone printable HTML reports citing stable evidence record IDs.

---

## 3. Technology Stack

- **Frontend**: Next.js 14 App Router, TypeScript (Strict Mode), Tailwind CSS, Lucide icons, React Flow (`reactflow`), Recharts.
- **Backend**: Python 3.12+, FastAPI, SQLAlchemy, SQLite (WAL mode), Pydantic v2, Server-Sent Events (SSE).
- **Forensics Engine**: Native Windows EVTX parser (`python-evtx`), Sysmon JSON/CSV parsers, safe ZIP extractor, and optional adapters for The Sleuth Kit (TSK), Autopsy, and Volatility 3.
- **Testing**: Pytest test suite covering parsers, tools, verifier, agent state, and API endpoints.

---

## 4. Quick Start & Installation

### Prerequisites
- Python 3.12 or newer
- Node.js v18 or newer
- npm v9 or newer

### Setup Backend
```bash
# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate  # On Linux / macOS

# 2. Install dependencies
pip install fastapi "uvicorn[standard]" pydantic sqlalchemy pytest httpx python-multipart python-dateutil python-evtx
```

### Setup Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## 5. Running the Application

### Option A: Using the Windows Startup Script
```powershell
.\scripts\run_all.ps1
```

### Option B: Running Services Separately
**Terminal 1 (Backend):**
```powershell
.\venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
*Backend runs on `http://127.0.0.1:8000` (OpenAPI Swagger at `http://127.0.0.1:8000/docs`).*

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run start
```
*Frontend runs on `http://localhost:3000`.*

---

## 6. Running the Automated Test Suite

Run all 19 unit, integration, and agent loop tests:
```powershell
.\venv\Scripts\pytest backend\tests -v
```

All 19 tests pass:
- `test_parsers.py`: Timestamp normalization, JSON/CSV parsing, Zip-Slip traversal defense.
- `test_tools.py`: Audited tool registry, event querying, process ancestry reconstruction, timeline UTC ordering, correlation.
- `test_verifier.py`: Independent deterministic verification (supported claims, rejection of fabricated IDs, contradiction detection, degraded evidence handling).
- `test_agent.py`: Agent state transitions, bounded loops, idempotent retry, and replanning fallback.
- `test_api.py`: FastAPI health, cases, artifacts, and tools status.

---

## 7. Judge Walkthrough & Demonstration Guide

### Step 1: Open TRACE Dashboard
Visit `http://localhost:3000` in your web browser. You will see the Overview Dashboard with real metrics derived from the database and the **OFFLINE DEMO READY** status indicator.

### Step 2: Start Demo Investigation (Case A)
Click **"Run Demo Investigation"** (or **"Run Complete Demo (Case A)"**).
- TRACE initializes the synthetic incident, computes SHA-256 hashes for `security_sysmon_bundle.json`, and launches the adaptive agent.
- You are automatically routed to the **Live Investigation Center** (`/investigations/[id]`).

### Step 3: Observe Live Adaptive Planning
Watch the **Live Trace** center panel stream backend events in real-time via SSE:
1. `inspect_case`: Reads manifest, verifies SHA-256 digests, catalogs telemetry.
2. `query_events`: Detects suspicious PowerShell encoded command (`powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ...`).
3. `trace_process`: Reconstructs ancestry: `explorer.exe` (3420) &rarr; `cmd.exe` (4820) &rarr; `powershell.exe` (5912).
4. `query_events`: Discovers dropped payload `C:\Windows\Cache\scvhost.exe`.
5. `correlate_artifacts`: Links user `SYSTEM_ADMIN`, payload dropping, network socket to `198.51.100.42:443`, and persistence Run key.
6. `verify_claim`: Submits claims to the deterministic independent verifier.

### Step 4: Inject a Real Tool Failure
Click **"Inject Tool Failure (Demo Control)"** in the left panel:
- Select **"Endpoint Query Connection Failure (ECONNRESET)"** and click **"Arm Failure Injection"**.
- Watch the backend record the failure, execute bounded idempotent retries, and emit a `replanned` event to recover via an alternative approved tool.

### Step 5: Inspect Verification & Evidence Provenance
- In the right panel, click on **Finding 1** (*"Unauthorized Payload Dropped via PowerShell"*).
- Click on **Record #REC-00105**:
- The **Forensic Source Record Inspector** drawer slides open, displaying:
  - Source record ID
  - Normalized process and file paths
  - UTC timestamp and original timezone
  - SHA-256 source hash

### Step 6: Explore Incident Visualizations
Switch between the tabs above the center panel:
- **Timeline**: Chronological event list with search and type filters.
- **Process Tree**: Observed executions vs missing parent gaps.
- **Evidence Graph**: Interactive React Flow node-link graph.

### Step 7: Export Verifiable Report
Click **"Export Report"** in the top right to open the complete printable HTML incident report with cryptographic manifest and evidence citations.

### Step 8: Test Degraded Evidence (Case B)
Return to `/` and click **"Run Degraded Evidence Demo (Case B)"**.
- In Case B, the process creation log for `scvhost.exe` was omitted.
- The verifier rejects direct execution, classifying the claim as **`[UNRESOLVED]`** with explicit evidentiary gap notes.
- Proves that TRACE **refuses to hallucinate conclusions** when primary evidence is missing.

---

## 8. Operating Boundaries & Security

- **Forensic Analysis Only**: Never executes live endpoint remediation, process termination, or live file deletion.
- **Strict Allowlist**: LLM is never given arbitrary shell access.
- **Prompt Injection Defense**: All evidence contents are treated as untrusted data strings.
- **Read-Only Storage**: Uploaded originals are marked read-only on disk (`chmod & ~S_IWRITE`).
- **Zip-Slip Defense**: Archive extractions verify destination boundaries before writing files.

---

## 9. License & Team
Built for hackathon demonstration. TRACE is open for incident response, digital forensics research, and autonomous cyber analysis.
