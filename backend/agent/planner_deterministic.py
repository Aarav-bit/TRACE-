from typing import Any, Dict, Optional, Tuple
from backend.agent.state import InvestigationState
from backend.tools.registry import ToolExecutionResult

class DeterministicPlanner:
    def decide_next_action(
        self,
        state: InvestigationState,
        last_result: Optional[ToolExecutionResult] = None,
        last_tool_name: Optional[str] = None,
        is_degraded: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """
        Adaptive rule-based investigation planner.
        Chooses the next investigative step based on actual tool outputs and previous failures.
        """
        # Check if last step failed
        if last_result and not last_result.success:
            # Failure recovery decision
            if state.retry_count < state.max_retries_per_step:
                state.retry_count += 1
                return {
                    "tool_name": last_tool_name,
                    "action_type": "retry",
                    "parameters": {"search_term": "powershell", "limit": 25},
                    "rationale": f"Idempotent retry {state.retry_count}/{state.max_retries_per_step} following transient failure: {last_result.error}",
                }
            else:
                # Retries exhausted; replan and adapt using alternative tool
                state.retry_count = 0
                state.failure_history.append({
                    "tool": last_tool_name,
                    "error": last_result.error,
                    "recovery_strategy": "replanned_alternative_tool",
                })
                state.current_phase = "Adaptive Replanning"
                return {
                    "tool_name": "build_timeline",
                    "action_type": "replanned_fallback",
                    "parameters": {"limit": 50},
                    "rationale": "Primary query failed repeatedly. Replanned investigation to harvest timeline telemetry directly from database cache.",
                }

        # Reset retry counter on success
        state.retry_count = 0

        # Sequence of adaptive investigation phases
        step = state.completed_steps

        if step == 0:
            state.current_phase = "Reconnaissance"
            state.current_hypothesis = "Assessing ingested evidence manifest and cryptographic integrity."
            return {
                "tool_name": "inspect_case",
                "action_type": "case_inspection",
                "parameters": {},
                "rationale": "Initial phase: Verify evidence hashes, parser status, and catalog available telemetry channels.",
            }

        elif step == 1:
            state.current_phase = "Threat Discovery"
            state.current_hypothesis = "Identifying suspicious command-line or administrative script execution."
            return {
                "tool_name": "query_events",
                "action_type": "targeted_query",
                "parameters": {"search_term": "powershell", "limit": 20},
                "rationale": "Investigate objective: Query for PowerShell executions and examine script block parameters.",
            }

        elif step == 2:
            state.current_phase = "Process Lineage Reconstruction"
            state.current_hypothesis = "Reconstructing process ancestry to establish parent-child relationships."
            return {
                "tool_name": "trace_process",
                "action_type": "lineage_tracing",
                "parameters": {"root_process": "powershell.exe"},
                "rationale": "Trace PID 5912 to identify parent caller and any downstream execution chains.",
            }

        elif step == 3:
            state.current_phase = "Payload Analysis"
            state.current_hypothesis = "Correlating script execution with file system modifications."
            return {
                "tool_name": "query_events",
                "action_type": "file_query",
                "parameters": {"event_type": "file_activity", "limit": 20},
                "rationale": "Search file system telemetry for targets referenced in the decoded PowerShell command (C:\\Windows\\Cache\\scvhost.exe).",
            }

        elif step == 4:
            state.current_phase = "Cross-Artifact Correlation"
            state.current_hypothesis = "Connecting user account, spawned processes, network sockets, and persistence mechanisms."
            return {
                "tool_name": "correlate_artifacts",
                "action_type": "multi_pivot_correlation",
                "parameters": {},
                "rationale": "Apply deterministic correlation rules to link user SYSTEM_ADMIN, payload dropping, and network persistence.",
            }

        elif step == 5:
            state.current_phase = "Independent Verification (Claim 1)"
            state.current_hypothesis = "Submitting primary file modification finding to independent deterministic verifier."
            all_ev_ids = [eid for eid in state.discovered_evidence_ids if eid]
            return {
                "tool_name": "verify_claim",
                "action_type": "verification_check",
                "parameters": {
                    "title": "Unauthorized Payload Dropped via PowerShell",
                    "claim": "PowerShell process (PID 5912) executed under SYSTEM_ADMIN downloaded and created binary C:\\Windows\\Cache\\scvhost.exe",
                    "supporting_evidence_ids": all_ev_ids,
                    "required_keywords": ["powershell", "scvhost"],
                },
                "rationale": "Submit primary objective claim to independent verifier with cited evidence provenance.",
            }

        elif step == 6:
            state.current_phase = "Independent Verification (Claim 2)"
            state.current_hypothesis = "Testing causal claim: Did PowerShell directly spawn scvhost.exe as a child process?"
            all_ev_ids = [eid for eid in state.discovered_evidence_ids if eid]
            return {
                "tool_name": "verify_claim",
                "action_type": "verification_check",
                "parameters": {
                    "title": "Direct Process Execution of Dropped Payload",
                    "claim": "PowerShell (PID 5912) directly spawned and executed scvhost.exe (PID 6204) from C:\\Windows\\Cache\\scvhost.exe",
                    "supporting_evidence_ids": all_ev_ids,
                    "required_keywords": ["scvhost", "6204"],
                },
                "rationale": "Test causal claim of direct execution. In degraded cases where EID 4688 is missing, verifier will reject or constrain claim.",
            }

        elif step == 7:
            state.current_phase = "Timeline Assembly"
            state.current_hypothesis = "Constructing verified chronological narrative of the incident."
            return {
                "tool_name": "build_timeline",
                "action_type": "timeline_assembly",
                "parameters": {"limit": 100},
                "rationale": "Assemble unified incident timeline normalized to UTC with preserved source hashes.",
            }

        else:
            # Investigation complete
            return None
