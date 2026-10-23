"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Key,
  Sliders,
  RotateCcw,
  Check,
  Cpu,
  Sparkles,
  ExternalLink,
  Activity,
  AlertCircle,
  CheckCircle2,
  Lock,
  Trash2,
} from "lucide-react";
import {
  fetchSettings,
  updateSettings,
  testNvidiaConnection,
  purgeAllCases,
  SettingsData,
} from "@/lib/api";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

export default function SettingsPage() {
  const [llmProvider, setLlmProvider] = useState<string>("nvidia");
  const [nvidiaKey, setNvidiaKey] = useState<string>("");
  const [nvidiaModel, setNvidiaModel] = useState<string>("nvidia/nemotron-3.5-super-vl-120b-a12b");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [maxSteps, setMaxSteps] = useState<number>(15);
  const [toolTimeout, setToolTimeout] = useState<number>(15);

  const [initialData, setInitialData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSettings();
        setInitialData(data);
        setLlmProvider(data.llm_provider || "nvidia");
        setNvidiaModel(data.nvidia_model || "nvidia/nemotron-3.5-super-vl-120b-a12b");
        setMaxSteps(data.max_investigation_steps || 15);
        setToolTimeout(data.tool_timeout_seconds || 15);
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateSettings({
        llm_provider: llmProvider,
        nvidia_api_key: nvidiaKey || undefined,
        nvidia_model: nvidiaModel,
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        max_investigation_steps: maxSteps,
        tool_timeout_seconds: toolTimeout,
      });
      setInitialData(updated);
      setNvidiaKey("");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      alert("Failed to save settings: " + (e as Error).message);
    }
  };

  const handleTestNvidia = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testNvidiaConnection({
        api_key: nvidiaKey || undefined,
        model: nvidiaModel,
      });
      if (res.success) {
        setTestResult({
          success: true,
          message: `${res.message} Model: ${res.model}`,
        });
      } else {
        setTestResult({
          success: false,
          error: res.error || "Connection test failed",
        });
      }
    } catch (e) {
      setTestResult({
        success: false,
        error: (e as Error).message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePurgeAll = async () => {
    if (!confirm("Are you sure you want to purge all cases, artifacts, and findings? This leaves a clean, pristine workspace.")) return;
    setIsResetting(true);
    try {
      await purgeAllCases();
      alert("All cases and evidence purged. Workspace is clean.");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to purge data.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Investigation Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-lime-100 text-lime-800 border border-lime-200">
              AI &amp; Limits
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure adaptive reasoning models, NVIDIA Nemotron 120B NIM integration, and telemetry limits.
          </p>
        </div>

        {isSaved && (
          <div className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Primary Intelligence Mode */}
        <SpotlightCard className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Reasoning Intelligence Mode
            </h2>
            <span className="text-[11px] font-mono font-medium text-slate-400">
              Autonomous Adaptive Agent
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NVIDIA Option */}
            <div
              onClick={() => setLlmProvider("nvidia")}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                llmProvider === "nvidia" || llmProvider === "nemotron"
                  ? "border-lime-500 bg-lime-50/40 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-lime-100 text-lime-800">
                    <Sparkles className="w-4 h-4 text-lime-700" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-200 text-lime-900 font-mono">
                    120B REASONING
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  NVIDIA Nemotron 3.5 Super VL
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Vision-language reasoning model on NVIDIA NIM API. Performs structured multi-step forensic hypothesis testing, parent-child deductions, and MITRE threat mapping.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>nvidia/nemotron-3.5-super-vl-120b</span>
                {(llmProvider === "nvidia" || llmProvider === "nemotron") && (
                  <CheckCircle2 className="w-4 h-4 text-lime-600" />
                )}
              </div>
            </div>

            {/* Deterministic Option */}
            <div
              onClick={() => setLlmProvider("deterministic")}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                llmProvider === "deterministic"
                  ? "border-sky-500 bg-sky-50/40 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-sky-100 text-sky-800">
                    <Cpu className="w-4 h-4 text-sky-700" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 font-mono">
                    OFFLINE / LOCAL
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Autonomous Local DFIR Engine
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Zero external dependencies. Dynamic rule-based heuristics, regex LOLBin anomaly detection, and deterministic claim verifications inside local process memory.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Zero Cloud Dependency</span>
                {llmProvider === "deterministic" && (
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                )}
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Card 2: NVIDIA NIM API Configuration */}
        {(llmProvider === "nvidia" || llmProvider === "nemotron") && (
          <SpotlightCard className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. NVIDIA NIM API Credentials
                </h2>
              </div>
              <a
                href="https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-lime-700 hover:text-lime-800 flex items-center gap-1 font-semibold transition-colors"
              >
                <span>Get API Key at build.nvidia.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Key Status Pill */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="font-semibold text-slate-700">Server Configuration: </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {initialData?.nvidia_api_key_configured ? "Configured (Active on Server)" : "Not Set (Fallback to Local DFIR)"}
                  </span>
                </div>
              </div>
              {initialData?.nvidia_api_key_configured && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Ready
                </span>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Update NVIDIA API Key (Bearer Token)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={nvidiaKey}
                    onChange={(e) => setNvidiaKey(e.target.value)}
                    placeholder="nvapi-..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestNvidia}
                    disabled={isTesting}
                    className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all border border-slate-200 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Activity className={`w-3.5 h-3.5 text-lime-600 ${isTesting ? "animate-spin" : ""}`} />
                    <span>{isTesting ? "Testing..." : "Test Connection"}</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                    testResult.success
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.success ? testResult.message : testResult.error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Model Endpoint Name
                </label>
                <input
                  type="text"
                  value={nvidiaModel}
                  onChange={(e) => setNvidiaModel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>
          </SpotlightCard>
        )}

        {/* Card 3: Execution Bounds & Safety Limits */}
        <SpotlightCard className="p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            3. Investigation Safety Bounds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Maximum Iteration Steps
              </label>
              <input
                type="number"
                min={5}
                max={50}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-all font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Prevents infinite investigative loops. Default: 15.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Forensic Tool Timeout (Seconds)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={toolTimeout}
                onChange={(e) => setToolTimeout(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-all font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Maximum execution duration for TSK or Volatility 3 commands.
              </span>
            </div>
          </div>
        </SpotlightCard>

        {/* Card 4: Database Maintenance */}
        <SpotlightCard className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Database Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Purge all cases, ingested evidence, and findings to reset the workspace to pristine zero state.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePurgeAll}
              disabled={isResetting}
              className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All Records</span>
            </button>
          </div>
        </SpotlightCard>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 rounded-full bg-[#111317] hover:bg-black text-white text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Save Configuration Changes
          </button>
        </div>
      </form>
    </div>
  );
}
