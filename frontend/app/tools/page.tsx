"use client";

import React, { useEffect, useState } from "react";
import { Wrench, CheckCircle2, XCircle, Info, RefreshCw, Terminal, Cpu } from "lucide-react";
import { fetchToolsStatus } from "@/lib/api";
import { ToolStatusItem } from "@/lib/types";

export default function ForensicToolsPage() {
  const [tools, setTools] = useState<ToolStatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const data = await fetchToolsStatus();
      setTools(data);
    } catch (e) {
      console.error("Failed to load tools status:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-cyber-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-cyber-text">
              Forensic Tool Registry & Adapters
            </h1>
          </div>
          <p className="text-xs text-cyber-muted font-mono mt-0.5">
            Audited, whitelisted tool execution environment with health monitoring and graceful degradation
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-md bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-xs text-cyber-text font-mono flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Probe Environment</span>
        </button>
      </div>

      {/* Overview Note */}
      <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border text-xs text-cyber-muted leading-relaxed flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyber-text block mb-0.5">
            Graceful Degradation Guarantee
          </span>
          TRACE executes through a fixed, strictly allowlisted tool registry. Core investigation,
          process ancestry reconstruction, timeline normalization, and independent verification are built-in and
          require zero external tools. Optional integrations (The Sleuth Kit, Autopsy, Volatility 3) are automatically
          probed and enabled only when present.
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="p-5 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-borderLight transition-all shadow-md space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-cyber-dim uppercase block">
                  {tool.category}
                </span>
                <h3 className="text-sm font-bold text-cyber-text leading-snug">
                  {tool.display_name}
                </h3>
              </div>

              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${
                  tool.installed
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-800"
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
                    Optional / Missing
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-cyber-surface/60 border border-cyber-border/60">
                <span className="text-cyber-dim text-[10px] block">Detected Version</span>
                <span className="text-cyber-text font-bold">{tool.version || "N/A (Not Found)"}</span>
              </div>
              <div className="p-2 rounded bg-cyber-surface/60 border border-cyber-border/60">
                <span className="text-cyber-dim text-[10px] block">Health Status</span>
                <span className={tool.installed ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {tool.last_health_check}
                </span>
              </div>
            </div>

            {/* Supported Operations */}
            <div>
              <span className="text-[10px] font-mono text-cyber-dim uppercase block mb-1.5">
                Supported Operations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tool.supported_operations.map((op, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-sky-300"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>

            {/* Configuration Guidance */}
            <div className="pt-2 border-t border-cyber-border/40 text-[11px] text-cyber-dim font-mono leading-relaxed">
              <span className="text-cyber-muted font-bold">Config: </span>
              {tool.configuration_guidance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
