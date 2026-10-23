"use client";

import React, { useEffect, useState } from "react";
import {
  Wrench,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { fetchToolsStatus, toggleToolsBridge } from "@/lib/api";
import { ToolStatusItem } from "@/lib/types";

export default function ForensicToolsPage() {
  const [tools, setTools] = useState<ToolStatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [bridgeActive, setBridgeActive] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const data = await fetchToolsStatus();
      setTools(data);
      // Determine if external tools are operational
      const tsk = data.find((t) => t.name === "the_sleuth_kit");
      setBridgeActive(tsk ? tsk.installed : true);
    } catch (e) {
      console.error("Failed to load tools status:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBridge = async () => {
    setIsToggling(true);
    try {
      const res = await toggleToolsBridge();
      setBridgeActive(res.bridge_enabled);
      await loadStatus();
    } catch (e) {
      console.error("Failed to toggle tools mode:", e);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cyber-border pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-cyber-text tracking-wide">
              Forensic Tool Registry & External Adapters
            </h1>
          </div>
          <p className="text-xs text-cyber-muted font-mono mt-1">
            Audited tool execution sandbox: The Sleuth Kit CLI, Autopsy Ingest, Volatility 3, and native DFIR parsers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleBridge}
            disabled={isToggling || isLoading}
            className={`px-3 py-1.5 rounded-md border text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              bridgeActive
                ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-cyber-surface border-cyber-border text-cyber-muted hover:text-cyber-text"
            }`}
            title="Toggle between Forensic Bridge (Ready) and Strict Host PATH Audit"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {bridgeActive ? "Forensic Bridge: Active" : "Strict Host PATH Audit"}
            </span>
          </button>

          <button
            onClick={loadStatus}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-md bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-xs text-cyber-text font-mono flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Probe Environment</span>
          </button>
        </div>
      </div>

      {/* Overview Note */}
      <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border text-xs text-cyber-muted leading-relaxed flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyber-text block mb-0.5">
            Zero-Simulation Forensic Sandbox & Graceful Degradation
          </span>
          TRACE maintains an allowlisted forensic tool registry. Core investigation tasks (process ancestry trees, UTC normalization, and deterministic verification) are built-in. When disk images or memory dumps are ingested, TRACE invokes <strong>The Sleuth Kit CLI</strong> (`fls`, `istat`), <strong>Autopsy</strong>, or <strong>Volatility 3</strong>.
          If an external utility is missing on a host, TRACE detects the limitation and gracefully adapts without interrupting the case.
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="p-4 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-border/80 transition-all shadow-md flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-cyber-dim uppercase tracking-wider block">
                    {tool.category}
                  </span>
                  <h3 className="text-xs font-bold text-cyber-text leading-snug">
                    {tool.display_name}
                  </h3>
                </div>

                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-bold flex items-center gap-1 shrink-0 ${
                    tool.installed
                      ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-700"
                  }`}
                >
                  {tool.installed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Operational
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" />
                      Optional
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-cyber-surface/60 border border-cyber-border/60">
                  <span className="text-cyber-dim text-[9px] block uppercase">Detected Version</span>
                  <span className="text-cyber-text text-[11px] font-bold truncate block" title={tool.version || "N/A"}>
                    {tool.version || "N/A"}
                  </span>
                </div>
                <div className="p-2 rounded bg-cyber-surface/60 border border-cyber-border/60">
                  <span className="text-cyber-dim text-[9px] block uppercase">Health Status</span>
                  <span className={`text-[11px] font-bold truncate block ${tool.installed ? "text-emerald-400" : "text-amber-400"}`}>
                    {tool.last_health_check}
                  </span>
                </div>
              </div>

              {/* Supported Operations */}
              <div>
                <span className="text-[9px] font-mono text-cyber-dim uppercase block mb-1">
                  Supported Operations
                </span>
                <div className="flex flex-wrap gap-1">
                  {tool.supported_operations.map((op, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyber-surface border border-cyber-border/70 text-sky-300"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration Guidance */}
            <div className="pt-2 border-t border-cyber-border/40 text-[10px] text-cyber-dim font-mono leading-relaxed">
              <span className="text-cyber-muted font-bold">Config: </span>
              {tool.configuration_guidance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
