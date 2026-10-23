import React from "react";
import {
  Activity,
  Terminal,
  HelpCircle,
  FileCheck,
  AlertCircle,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { InvestigationAction } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";

interface LiveTraceProps {
  actions: InvestigationAction[];
  isConnected: boolean;
  onSelectEvidenceId?: (id: string) => void;
}

export const LiveTrace: React.FC<LiveTraceProps> = ({
  actions,
  isConnected,
  onSelectEvidenceId,
}) => {
  return (
    <div className="flex flex-col h-full bg-cyber-bg overflow-y-auto p-6 space-y-5">
      {/* Trace Header & SSE Status */}
      <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-cyber-text tracking-wide">
            Live Investigation Trace
          </h2>
          <span className="text-xs font-mono text-cyber-dim">
            ({actions.length} action{actions.length === 1 ? "" : "s"} logged)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className={isConnected ? "text-emerald-400" : "text-amber-400"}>
            {isConnected ? "SSE Stream Connected" : "Polling / Restoring..."}
          </span>
        </div>
      </div>

      {/* Action Cards Stream */}
      {actions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-cyber-muted space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyber-surface border border-cyber-border flex items-center justify-center text-sky-400 animate-pulse">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-cyber-text">
            Investigation Initializing...
          </h3>
          <p className="text-xs text-cyber-dim max-w-sm">
            The adaptive agent is inspecting the case manifest and formulating its initial hypothesis.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map((act) => {
            const isFailed = act.status === "failed";
            const isRetrying = act.status === "retrying";
            const isReplanned = act.status === "replanned";
            const isRunning = act.status === "running";

            const evidenceIds = act.structured_result?.evidence_ids || [];

            return (
              <div
                key={act.id || act.sequence_number}
                className={`rounded-lg border p-4 transition-all shadow-md ${
                  isFailed
                    ? "bg-rose-950/20 border-rose-800/80"
                    : isReplanned
                    ? "bg-purple-950/20 border-purple-800/80"
                    : isRunning
                    ? "bg-sky-950/20 border-sky-600/80"
                    : "bg-cyber-card border-cyber-border"
                }`}
              >
                {/* Card Top Row */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyber-dim px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border">
                      #{act.sequence_number.toString().padStart(2, "0")}
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-300">
                      {act.tool_name}
                    </span>
                    <span className="text-[11px] text-cyber-dim font-mono">
                      &bull; {act.action_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyber-dim">
                      {act.started_at ? new Date(act.started_at).toLocaleTimeString() : ""}
                    </span>
                    <StatusBadge status={act.status} size="sm" />
                  </div>
                </div>

                {/* Why Chosen / Rationale */}
                {act.rationale && (
                  <div className="mb-3 p-2.5 rounded bg-cyber-surface/60 border border-cyber-border/60 text-xs text-cyber-muted flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono text-cyber-dim uppercase block">
                        Investigative Rationale
                      </span>
                      <p className="text-cyber-text leading-relaxed">{act.rationale}</p>
                    </div>
                  </div>
                )}

                {/* Validated Inputs Summary */}
                {act.validated_inputs && Object.keys(act.validated_inputs).length > 0 && (
                  <div className="mb-3 text-[11px] font-mono text-cyber-dim flex items-center gap-2 flex-wrap">
                    <span className="text-cyber-muted font-semibold">Inputs:</span>
                    {Object.entries(act.validated_inputs).map(([k, v]) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-cyber-text"
                      >
                        {k}: <span className="text-sky-300 font-bold">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Result Summary */}
                {act.result_summary && (
                  <div className="text-xs text-cyber-text leading-relaxed mb-2 font-mono bg-cyber-bg/70 p-3 rounded border border-cyber-border">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold uppercase mb-1">
                      <FileCheck className="w-3.5 h-3.5" /> Result Summary
                    </div>
                    {act.result_summary}
                  </div>
                )}

                {/* Error & Recovery Details */}
                {act.error_details && (
                  <div className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded border border-rose-800 mb-2 font-mono">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] mb-1 text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" /> Failure Diagnostic
                    </div>
                    {act.error_details}
                    <div className="mt-2 pt-2 border-t border-rose-800/60 text-[11px] text-amber-300 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Recovery: Classifying error & formulating replacement query...</span>
                    </div>
                  </div>
                )}

                {/* Cited Evidence IDs Chips */}
                {evidenceIds.length > 0 && onSelectEvidenceId && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-cyber-border/40 mt-2">
                    <span className="text-[10px] font-mono text-cyber-dim uppercase">
                      Evidence Cited:
                    </span>
                    {evidenceIds.map((eid: string) => (
                      <button
                        key={eid}
                        onClick={() => onSelectEvidenceId(eid)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>REC-{eid.slice(0, 8)}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
