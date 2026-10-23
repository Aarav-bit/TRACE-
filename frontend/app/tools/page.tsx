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
  ShieldCheck,
} from "lucide-react";
import { fetchToolsStatus, toggleToolsBridge } from "@/lib/api";
import { ToolStatusItem } from "@/lib/types";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Forensic Tool Registry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-lime-100 text-lime-800 border border-lime-200">
              Adapters
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audited execution sandbox: The Sleuth Kit (TSK CLI), Autopsy Ingest, Volatility 3, and native DFIR engines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleBridge}
            disabled={isToggling || isLoading}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              bridgeActive
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
            }`}
            title="Toggle between Forensic Bridge (Ready) and Strict Host PATH Audit"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {bridgeActive ? "Forensic Bridge: Active" : "Strict Host PATH Audit"}
            </span>
          </button>

          <button
            onClick={loadStatus}
            disabled={isLoading}
            className="px-4 py-2 rounded-full bg-[#111317] hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Probe Tools</span>
          </button>
        </div>
      </div>

      {/* Explanatory Banner */}
      <SpotlightCard className="p-5 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-slate-100 text-slate-700 mt-0.5 shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-900 block mb-0.5">
            Decoupled Forensic Tooling &amp; Real Hardware Adapters
          </span>
          TRACE executes through allowlisted adapters. Core operations (process trees, UTC normalization, verifier claims) are natively built-in. When disk images or memory dumps are ingested, TRACE invokes <strong>The Sleuth Kit CLI</strong> (<code>fls</code>, <code>istat</code>), <strong>Autopsy CLI</strong>, or native <strong>Volatility 3</strong>. If an external utility is missing on a host, TRACE detects the limitation and seamlessly adapts.
        </div>
      </SpotlightCard>

      {/* Tools Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool) => (
          <SpotlightCard
            key={tool.name}
            className="p-6 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
                    {tool.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {tool.display_name}
                  </h3>
                </div>

                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${
                    tool.installed
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {tool.installed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Operational</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" />
                      <span>Optional</span>
                    </>
                  )}
                </span>
              </div>

              {/* Version & Health */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[9px] font-bold block uppercase">Detected Version</span>
                  <span className="text-slate-800 text-[11px] font-bold truncate block" title={tool.version || "N/A"}>
                    {tool.version || "N/A"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[9px] font-bold block uppercase">Health Status</span>
                  <span className="text-slate-800 text-[11px] font-bold truncate block" title={tool.last_health_check || "N/A"}>
                    {tool.last_health_check || "Operational"}
                  </span>
                </div>
              </div>

              {/* Supported Ops */}
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Supported Forensic Operations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tool.supported_operations.map((op, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-mono font-medium"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Guidance */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              {tool.configuration_guidance}
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
