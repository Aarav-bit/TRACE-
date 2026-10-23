# TRACE Forensic Tool Integrations

TRACE utilizes a two-tier forensic execution architecture:

## 1. Native Built-in Forensic Subsystems (Always Operational)
The core forensic capabilities are self-contained and require zero external software or paid accounts:
- **`inspect_case`**: Calculates cryptographic SHA-256 hashes on ingested evidence, parses headers, assesses missing telemetry streams, and catalogs sources.
- **`query_events`**: High-performance multi-attribute forensic event indexing, filtering by PID, PPID, username, timestamp range, and regex patterns.
- **`trace_process`**: Parent-child execution lineage assembler distinguishing observed execution (Windows EID 4688 / Sysmon EID 1) from inferred telemetry and unobserved parent gaps.
- **`build_timeline`**: Unified chronological incident reconstruction normalized to UTC while strictly preserving original timestamps and timezone provenance.
- **`correlate_artifacts`**: Multi-pivot rule engine connecting user logins, script execution blocks, dropped payload binaries, persistence Run keys, and network sockets into a structured React Flow graph.
- **`verify_claim`**: Independent deterministic verification subsystem evaluating claims against database records and ground-truth criteria independently of model confidence.

## 2. External Forensic Suite Adapters (Optional)
When external command-line utilities are installed on the host system, TRACE probes their version and registers their operations through safe, audited subprocess wrappers:
- **The Sleuth Kit (TSK)**:
  - Utilities probed: `fls`, `istat`, `mactime`
  - Integration: Raw disk images (`.raw`, `.dd`, `.e01`)
  - Status: If missing from PATH, TRACE marks the adapter `Optional / Missing` and continues without failing.
- **Autopsy Digital Forensics**:
  - Integration: Command-line ingest workflow processor
  - Path: Detected via system PATH or `AUTOPSY_PATH` environment variable.
- **Volatility 3 Framework**:
  - Integration: Memory forensics (`windows.pslist`, `windows.malfind`, `windows.netscan`)
  - Status: Enabled when a memory dump (`.raw`, `.dmp`) is present and `volatility3` is detected.
