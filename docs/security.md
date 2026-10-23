# TRACE Security Architecture & Operating Boundaries

TRACE is engineered to handle sensitive digital forensics evidence safely.

## 1. Operating Boundaries
- **Forensic Analysis, Not Live Remediation**: TRACE is an evidence investigation engine, not a live endpoint response agent. It never deletes files, never modifies live registry keys, and never kills live processes.
- **Strict Executable Allowlists**: The agent coordinates only audited, whitelisted internal tools and approved external wrappers (`fls`, `istat`, `autopsy`, `volatility`). The LLM is never permitted to execute arbitrary shell commands.
- **No Untrusted Code Execution**: Uploaded binaries, scripts, or disk images are never executed on the host system.

## 2. Evidence Integrity & Chain-of-Custody
- **Immediate SHA-256 Hashing**: Ingested files are hashed via SHA-256 streaming before any parsing commences.
- **Read-Only Disk Originals**: Upon ingestion, files are marked read-only on disk (`chmod & ~S_IWRITE`) to guarantee byte-for-byte preservation.
- **Isolated Working Copies**: Parsing operations occur on temporary memory buffers or safe working copies.
- **Zip-Slip Path Traversal Protection**: Archive extractions verify that every member path strictly resolves inside the destination directory, blocking malicious `../` path traversal attacks.

## 3. Prompt-Injection Defense
Forensic evidence inevitably contains adversary-controlled strings (e.g. malicious command lines, script blocks, filenames containing prompt injection text).
- **Untrusted Input Isolation**: All evidence contents are treated strictly as untrusted data strings.
- **No Instruction Following in Evidence**: System prompts and parsing schemas enforce that text within logs cannot override agent instructions.
- **Minimal Exposure to LLM**: The LLM planner receives only high-level normalized metadata necessary to select the next tool, rather than unrestricted raw log streams.

## 4. Cryptographic Audit Hash-Chain
All case actions are recorded in an append-only audit ledger where:
`entry_hash = SHA256(previous_hash + sequence_number + event_type + JSON(event_data) + timestamp)`
Unexpected local modifications to audit logs become mathematically detectable.
