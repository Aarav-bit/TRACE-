"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import { fetchCases, seedDemoCase, resetDemoEnvironment, startInvestigation } from "@/lib/api";
import { Case } from "@/lib/types";

interface TopBarProps {
  currentTitle?: string;
  activeCaseId?: string;
  onCaseChange?: (caseId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTitle = "Overview",
  activeCaseId,
  onCaseChange,
}) => {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>(activeCaseId || "");
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  useEffect(() => {
    fetchCases()
      .then((data) => {
        setCases(data);
        if (!selectedCase && data.length > 0) {
          const defaultCase = data.find((c) => c.is_demo) || data[0];
          setSelectedCase(defaultCase.id);
          if (onCaseChange) onCaseChange(defaultCase.id);
        }
      })
      .catch(() => {});
  }, []);

  const handleCaseSelect = (caseId: string) => {
    setSelectedCase(caseId);
    if (onCaseChange) onCaseChange(caseId);
  };

  const handleRunDemo = async () => {
    setIsLoadingDemo(true);
    try {
      // Seed Case A
      const seedRes = await seedDemoCase("complete");
      // Start an investigation on this case
      const inv = await startInvestigation(seedRes.case_id, {
        mode: "deterministic",
      });
      // Navigate to live center
      router.push(`/investigations/${inv.id}`);
    } catch (err) {
      console.error("Failed to run demo:", err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await resetDemoEnvironment();
      window.location.reload();
    } catch (err) {
      console.error("Failed to reset:", err);
    }
  };

  return (
    <header className="h-16 bg-cyber-card border-b border-cyber-border px-6 flex items-center justify-between shrink-0">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-cyber-dim uppercase">TRACE</span>
        <span className="text-cyber-dim">/</span>
        <h1 className="text-sm font-semibold text-cyber-text tracking-wide">
          {currentTitle}
        </h1>
      </div>

      {/* Right: Case Selector & Controls */}
      <div className="flex items-center gap-3">
        {/* Case Selector */}
        {cases.length > 0 && (
          <div className="flex items-center gap-2 bg-cyber-surface border border-cyber-border rounded-md px-3 py-1.5 text-xs">
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-cyber-dim font-mono text-[11px]">CASE:</span>
            <select
              value={selectedCase}
              onChange={(e) => handleCaseSelect(e.target.value)}
              className="bg-transparent text-cyber-text font-medium text-xs focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-cyber-surface text-cyber-text">
                  {c.name} {c.is_demo ? "(Demo)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyber-surface border border-cyber-border text-[11px] font-mono text-cyber-muted">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Forensic Engine · Typed Registry</span>
        </div>

        {/* Offline Demo Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-[11px] font-mono text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>OFFLINE DEMO READY</span>
        </div>

        {/* Reset Demo button */}
        <button
          onClick={handleResetDemo}
          title="Reset demonstration cases to pristine initial state"
          className="p-1.5 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-cyber-dim hover:text-cyber-text transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Run Demo Investigation Action */}
        <button
          onClick={handleRunDemo}
          disabled={isLoadingDemo}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          <span>{isLoadingDemo ? "Launching..." : "Run Demo Investigation"}</span>
        </button>
      </div>
    </header>
  );
};
