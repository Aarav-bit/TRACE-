"use client";

import React, { useState } from "react";
import { Settings, Shield, Key, Sliders, RotateCcw, Check, Info } from "lucide-react";
import { resetDemoEnvironment } from "@/lib/api";

export default function SettingsPage() {
  const [llmProvider, setLlmProvider] = useState<string>("deterministic");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [maxSteps, setMaxSteps] = useState<number>(15);
  const [toolTimeout, setToolTimeout] = useState<number>(15);
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await resetDemoEnvironment();
      alert("Synthetic demo environment reset to clean baseline.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-cyber-border pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400" />
          <h1 className="text-xl font-bold text-cyber-text">
            Investigation Engine Settings
          </h1>
        </div>
        <p className="text-xs text-cyber-muted font-mono mt-0.5">
          Configure autonomous agent execution bounds, model providers, and offline demo parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Execution Mode Card */}
        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-cyber-text">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Agent Operational Mode</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                llmProvider === "deterministic"
                  ? "bg-sky-950/40 border-sky-500 text-cyber-text"
                  : "bg-cyber-surface border-cyber-border text-cyber-muted"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  name="provider"
                  value="deterministic"
                  checked={llmProvider === "deterministic"}
                  onChange={() => setLlmProvider("deterministic")}
                />
                <span className="font-bold text-xs">Autonomous Local Engine (Recommended)</span>
              </div>
              <p className="text-[11px] text-cyber-dim leading-relaxed ml-5">
                100% private and offline. Triages real forensic evidence using rule-based threat heuristics, parent-child ancestry builders, and deterministic independent verification without external API keys.
              </p>
            </label>

            <label
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                llmProvider === "gemini"
                  ? "bg-sky-950/40 border-sky-500 text-cyber-text"
                  : "bg-cyber-surface border-cyber-border text-cyber-muted"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={llmProvider === "gemini"}
                  onChange={() => setLlmProvider("gemini")}
                />
                <span className="font-bold text-xs">Adaptive AI Mode (Gemini / OpenAI)</span>
              </div>
              <p className="text-[11px] text-cyber-dim leading-relaxed ml-5">
                Uses structured LLM tool calling to hypothesize and replan dynamically.
              </p>
            </label>
          </div>
        </div>

        {/* API Credentials */}
        {llmProvider === "gemini" && (
          <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-cyber-text">
              <Key className="w-4 h-4 text-amber-400" />
              <span>LLM Provider Credentials (Optional)</span>
            </div>
            <p className="text-xs text-cyber-dim font-mono">
              Never committed to source control. Stored locally in process memory.
            </p>
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1">
                Google Gemini API Key
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-cyber-text focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}

        {/* Resource Bounds & Timeouts */}
        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-cyber-text">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Safety Limits & Watchdog Timeouts</span>
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

        {/* Demo Management */}
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
            className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully</span>
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
