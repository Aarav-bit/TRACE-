"use client";

import React from "react";
import {
  Pause,
  Play,
  Square,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Clock,
  Sparkles,
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
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 overflow-y-auto p-5 space-y-5">
      {/* Investigation Meta */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-lime-800 px-2.5 py-1 rounded-full bg-lime-100 border border-lime-200">
            {currentPhase || "Reconnaissance"}
          </span>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">
            {stepsUsed}/{maxSteps} steps
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-lime-400 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (stepsUsed / maxSteps) * 100)}%` }}
          />
        </div>
      </div>

      {/* Dynamic Hypothesis Card */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Active Investigative Hypothesis</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          {currentHypothesis || "Reconstructing attack chain from telemetry..."}
        </p>
      </div>

      {/* Planned Steps List */}
      <div className="space-y-2.5">
        <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
          Forensic Plan Steps
        </h4>
        <div className="space-y-2">
          {DEFAULT_PLANNED_STEPS.map((step, idx) => {
            const isCompleted = idx < stepsUsed;
            const isCurrent = idx === stepsUsed && isRunning;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                  isCurrent
                    ? "bg-lime-50/70 border-lime-300 text-slate-900 font-semibold shadow-sm"
                    : isCompleted
                    ? "bg-slate-50 border-slate-200/60 text-slate-500"
                    : "bg-white border-slate-100 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5 text-lime-600 animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className="truncate leading-tight">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Investigation Controls */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
          Runtime Controls
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {isPaused ? (
            <button
              onClick={onResume}
              className="p-2 rounded-xl bg-lime-50 hover:bg-lime-100 border border-lime-200 text-lime-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-lime-600 text-lime-600" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              disabled={!isRunning}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Pause className="w-3 h-3 text-slate-600" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStop}
            disabled={!isRunning && !isPaused}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
            <span>Conclude</span>
          </button>
        </div>

        <button
          onClick={onOpenFailureInjection}
          className="w-full mt-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>Failure Injection</span>
        </button>
      </div>
    </div>
  );
};

export default PlanPanel;
