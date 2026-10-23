"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Activity,
  Plus,
  Download,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import { fetchCases, getSampleEvidenceDownloadUrl } from "@/lib/api";
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

  useEffect(() => {
    fetchCases()
      .then((data) => {
        setCases(data);
        if (!selectedCase && data.length > 0) {
          const defaultCase = data[0];
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

  return (
    <header className="h-16 bg-cyber-card border-b border-cyber-border px-6 flex items-center justify-between shrink-0">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-sky-400 font-bold uppercase tracking-wider">TRACE DFIR</span>
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
            <span className="text-cyber-dim font-mono text-[11px]">ACTIVE CASE:</span>
            <select
              value={selectedCase}
              onChange={(e) => handleCaseSelect(e.target.value)}
              className="bg-transparent text-cyber-text font-medium text-xs focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-cyber-surface text-cyber-text">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyber-surface border border-cyber-border text-[11px] font-mono text-cyber-muted">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Forensic Engine · 6 Built-in</span>
        </div>

        {/* Engine Ready Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-[11px] font-mono text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>AUTONOMOUS INVESTIGATOR ACTIVE</span>
        </div>

        {/* Download Sample Evidence package */}
        <a
          href={getSampleEvidenceDownloadUrl()}
          download="incident_triage_bundle.zip"
          title="Download sample incident triage archive (.zip) to test or demonstrate live upload"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-xs text-sky-300 font-mono transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Sample Evidence (.zip)</span>
        </a>

        {/* New Investigation Button */}
        <Link
          href="/investigations"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Case</span>
        </Link>
      </div>
    </header>
  );
};
