import React from "react";
import {
  Pause,
  Play,
  Square,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Investigation } from "@/lib/types";

interface PlanPanelProps {
  investigation: Investigation;
  currentPhase: string;
  currentHypothesis: string;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onOpenFailureInjection: () => void;
}

const DEFAULT_PLANNED_STEPS = [
  "Inspect case manifest and verify artifact integrity",
  "Search for suspicious process creation events",
  "Trace process ancestry and parentage",
  "Extract PowerShell script blocks and encoded commands",
  "Correlate file activity and network sockets",
  "Submit findings to independent deterministic verifier",
  "Assemble verified incident timeline",
];

export const PlanPanel: React.FC<PlanPanelProps> = ({
  investigation,
  currentPhase,
  currentHypothesis,
  isPaused,
  onPause,
  onResume,
  onStop,
  onOpenFailureInjection,
}) => {
  const stepsUsed = investigation.steps_used || 0;
  const maxSteps = investigation.max_steps || 15;
  const isRunning = investigation.status === "running";

  return (
    <div className="flex flex-col h-full bg-cyber-card border-r border-cyber-border overflow-y-auto p-4 space-y-5">
      {/* Investigation Meta */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/40">
            {currentPhase || "Reconnaissance"}
          </span>
          <span className="text-[11px] font-mono text-cyber-dim">
            {stepsUsed}/{maxSteps} steps
          </span>
        </div>

        <div className="flex items-center gap-2">
          {investigation.mode === "ai" ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              NVIDIA Nemotron 120B
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-sky-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              Local Forensic Engine
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-1">
            Objective
          </h2>
          <p className="text-xs text-cyber-text leading-relaxed p-2.5 rounded bg-cyber-surface/40 border border-cyber-border">
            {investigation.objective}
          </p>
        </div>
      </div>

      {/* Current Hypothesis */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-cyber-muted mb-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Working Hypothesis</span>
        </div>
        <div className="p-2.5 rounded bg-cyber-surface/40 border border-cyber-border text-xs text-cyber-text leading-relaxed">
          {currentHypothesis || "Synthesizing forensic indicators..."}
        </div>
      </div>

      {/* Investigation Controls */}
      <div>
        <h3 className="text-xs font-medium text-cyber-muted uppercase tracking-wider mb-2">
          Controls
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center justify-center gap-2 p-2 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black" /> Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              disabled={investigation.status !== "running"}
              className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-xs text-cyber-text transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          )}

          <button
            onClick={onStop}
            disabled={investigation.status === "completed" || investigation.status === "stopped"}
            className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-surface hover:bg-rose-950/40 border border-cyber-border hover:border-rose-800 text-xs text-cyber-muted hover:text-rose-300 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" /> Stop
          </button>
        </div>

        {/* Adversarial Disruption / Failure Resilience Test */}
        <button
          onClick={onOpenFailureInjection}
          className="w-full mt-2 flex items-center justify-center gap-2 p-2 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-xs text-cyber-muted hover:text-cyber-text transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulate Stream Disruption</span>
        </button>
      </div>

      {/* Planned Steps Progression */}
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3">
          Adaptive Investigation Plan
        </h3>
        <div className="space-y-2">
          {DEFAULT_PLANNED_STEPS.map((stepDesc, idx) => {
            const isCompleted = idx < stepsUsed;
            const isCurrent = idx === stepsUsed && isRunning;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded border text-xs flex items-start gap-2.5 transition-colors ${
                  isCurrent
                    ? "bg-sky-950/50 border-sky-600 text-sky-200"
                    : isCompleted
                    ? "bg-cyber-surface/40 border-cyber-border/80 text-cyber-muted"
                    : "bg-cyber-bg/40 border-cyber-border/40 text-cyber-dim"
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin block" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-cyber-dim" />
                  )}
                </div>
                <div className="flex-1 leading-snug">
                  <span className="font-mono text-[10px] text-cyber-dim mr-1.5">
                    STEP {idx + 1}
                  </span>
                  <span>{stepDesc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
