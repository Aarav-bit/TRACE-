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
} from "lucide-react";
import {
  fetchSettings,
  updateSettings,
  testNvidiaConnection,
  resetDemoEnvironment,
  SettingsData,
} from "@/lib/api";

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
      setNvidiaKey(""); // Clear secret input after saving
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

  const handleResetDemo = async () => {
    if (!confirm("Reset synthetic demonstration cases back to clean baseline state?")) return;
    setIsResetting(true);
    try {
      await resetDemoEnvironment();
      alert("Synthetic demo environment reset to clean baseline.");
    } catch (e) {
      console.error(e);
      alert("Failed to reset demo environment.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-cyber-border pb-4">
        <div className="flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-sky-400" />
          <h1 className="text-xl font-bold text-cyber-text tracking-wide">
            Investigation Engine & Model Settings
          </h1>
        </div>
        <p className="text-xs text-cyber-muted font-mono mt-1">
          Configure adaptive reasoning models, NVIDIA Nemotron 120B NIM integration, execution bounds, and telemetry thresholds.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agent Operational Mode */}
        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-cyber-text">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Primary Investigation Intelligence Mode</span>
            </div>
            <span className="text-[10px] font-mono text-cyber-dim uppercase tracking-wider">
              Autonomous Adaptive Agent
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* NVIDIA Nemotron Option */}
            <label
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                llmProvider === "nvidia" || llmProvider === "nemotron"
                  ? "bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "bg-cyber-surface/60 border-cyber-border hover:border-cyber-border/80 text-cyber-muted"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="provider"
                    value="nvidia"
                    checked={llmProvider === "nvidia" || llmProvider === "nemotron"}
                    onChange={() => setLlmProvider("nvidia")}
                    className="accent-emerald-400"
                  />
                  <span className="font-bold text-xs text-cyber-text">
                    NVIDIA Nemotron 3.5 Super VL
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  120B REASONING
                </span>
              </div>
              <p className="text-[11px] text-cyber-dim leading-relaxed pl-5">
                Flagship vision-language reasoning model hosted on NVIDIA NIM. Performs structured multi-step forensic hypothesis testing, parent-child process deductions, and MITRE threat mapping.
              </p>
            </label>

            {/* Deterministic / Local Engine Option */}
            <label
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                llmProvider === "deterministic"
                  ? "bg-sky-950/20 border-sky-500/80 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                  : "bg-cyber-surface/60 border-cyber-border hover:border-cyber-border/80 text-cyber-muted"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="provider"
                    value="deterministic"
                    checked={llmProvider === "deterministic"}
                    onChange={() => setLlmProvider("deterministic")}
                    className="accent-sky-400"
                  />
                  <span className="font-bold text-xs text-cyber-text">
                    Autonomous Local DFIR Engine
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  OFFLINE / PRIVATE
                </span>
              </div>
              <p className="text-[11px] text-cyber-dim leading-relaxed pl-5">
                Zero external dependencies. Dynamic rule-based threat heuristics, regex LOLBin anomaly detection, and deterministic claim verifications directly inside local process memory.
              </p>
            </label>
          </div>
        </div>

        {/* NVIDIA Configuration Panel (Visible when NVIDIA selected or configured) */}
        {(llmProvider === "nvidia" || llmProvider === "nemotron") && (
          <div className="p-5 rounded-lg bg-cyber-card border border-emerald-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-cyber-text tracking-wide uppercase">
                  NVIDIA NIM API Configuration
                </span>
              </div>
              <a
                href="https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors"
              >
                <span>Get API Key at build.nvidia.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Key Status Banner */}
            <div className="flex items-center justify-between p-3 rounded bg-cyber-surface border border-cyber-border text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyber-muted" />
                <div>
                  <div className="font-mono text-cyber-text text-xs flex items-center gap-2">
                    <span>Key Status:</span>
                    {initialData?.nvidia_api_key_configured ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Configured ({initialData.nvidia_api_key_masked})
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold">
                        Not configured (Enter key below or falls back to local engine)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestNvidia}
                disabled={isTesting || (!nvidiaKey && !initialData?.nvidia_api_key_configured)}
                className="px-3 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Activity className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "Pinging NIM..." : "Test Connection"}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded border text-xs font-mono flex items-start gap-2 ${
                  testResult.success
                    ? "bg-emerald-950/30 border-emerald-500 text-emerald-300"
                    : "bg-red-950/30 border-red-500 text-red-300"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {testResult.success ? "Connection Verified" : "Connection Error"}
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {testResult.success ? testResult.message : testResult.error}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-mono text-cyber-muted mb-1.5">
                  NVIDIA API Key (Bearer Token)
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-3 text-cyber-dim" />
                  <input
                    type="password"
                    placeholder={
                      initialData?.nvidia_api_key_configured
                        ? "Enter new key to replace existing"
                        : "nvapi-..."
                    }
                    value={nvidiaKey}
                    onChange={(e) => setNvidiaKey(e.target.value)}
                    className="w-full bg-cyber-surface border border-cyber-border rounded pl-9 pr-3 py-2 text-xs font-mono text-cyber-text placeholder:text-cyber-dim focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-cyber-dim block mt-1">
                  Stored securely in local environment variable and encrypted process RAM.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-cyber-muted mb-1.5">
                  Target NIM Model Identifier
                </label>
                <input
                  type="text"
                  value={nvidiaModel}
                  onChange={(e) => setNvidiaModel(e.target.value)}
                  className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-cyber-dim block mt-1">
                  Default: <code className="text-emerald-400">nvidia/nemotron-3.5-super-vl-120b-a12b</code>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Safety Limits & Watchdog Timeouts */}
        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-cyber-text">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Agent Guardrails & Autonomous Safety Limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1">
                Max Investigation Steps
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-cyber-text focus:outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-cyber-dim block mt-1">
                Upper bound for agent action loops to prevent runaway planning.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1">
                Tool Execution Timeout (Seconds)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={toolTimeout}
                onChange={(e) => setToolTimeout(Number(e.target.value))}
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-cyber-text focus:outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-cyber-dim block mt-1">
                Subprocess watchdog deadline before triggering error classification.
              </span>
            </div>
          </div>
        </div>

        {/* Demonstration Baseline Management */}
        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-cyber-text block">
              Demonstration Environment Reset
            </span>
            <p className="text-xs text-cyber-dim mt-0.5">
              Restores synthetic demonstration cases to original baseline state.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDemo}
            disabled={isResetting}
            className="px-4 py-2 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-xs text-cyber-text font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Configuration Saved</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
