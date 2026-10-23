"use client";

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
  CheckCircle2,
} from "lucide-react";
import { InvestigationAction } from "@/lib/types";

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
    <div className="flex flex-col h-full bg-slate-50/40 overflow-y-auto p-5 space-y-4">
      {/* Trace Header & SSE Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Live Investigation Trace
          </h2>
          <span className="text-xs font-mono text-slate-400">
            ({actions.length} action{actions.length === 1 ? "" : "s"} logged)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-lime-500 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className={isConnected ? "text-lime-700" : "text-amber-600"}>
            {isConnected ? "Stream Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Action Cards Stream */}
      {actions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600">
            <Activity className="w-6 h-6 animate-pulse text-lime-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Investigation Initializing...
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Autonomous reasoning agent is formulating initial forensic plan queries.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {actions.map((act) => {
            const isCompleted = act.status === "completed";
            const isFailed = act.status === "failed";
            const isRunning = act.status === "running";

            return (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition-all space-y-2.5"
              >
                {/* Header: Step Number, Tool & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center">
                      {act.sequence_number}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {act.tool_name}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : isFailed
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-lime-50 text-lime-800 border-lime-200 animate-pulse"
                    }`}
                  >
                    {act.status}
                  </span>
                </div>

                {/* Intent & Reasoning */}
                {act.rationale && (
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {act.rationale}
                  </p>
                )}

                {/* Parameters Snippet */}
                {act.validated_inputs && Object.keys(act.validated_inputs).length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700 break-all">
                    <span className="text-slate-400 font-bold mr-1">ARGS:</span>
                    {JSON.stringify(act.validated_inputs)}
                  </div>
                )}

                {/* Result Summary */}
                {act.result_summary && (
                  <div className="text-xs text-slate-800 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-lime-600 shrink-0 mt-0.5" />
                    <span className="truncate">{act.result_summary}</span>
                  </div>
                )}

                {/* Error Banner */}
                {act.error_details && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{act.error_details}</span>
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

export default LiveTrace;
