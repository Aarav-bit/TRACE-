"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
} from "lucide-react";
import { fetchCases } from "@/lib/api";
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
    <header className="h-14 bg-cyber-card/80 backdrop-blur-md border-b border-cyber-border px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-sky-400">
            TRACE
          </span>
        </div>
        <span className="text-cyber-dim text-xs">/</span>
        <h1 className="text-xs font-semibold text-cyber-text">
          {currentTitle}
        </h1>
      </div>

      {/* Right: Case Selector & Quick Actions */}
      <div className="flex items-center gap-2.5">
        {/* Active Case Selector */}
        {cases.length > 0 && (
          <div className="flex items-center gap-2 bg-cyber-surface/70 border border-cyber-border rounded-md px-2.5 py-1 text-xs">
            <FolderOpen className="w-3.5 h-3.5 text-cyber-muted" />
            <select
              value={selectedCase}
              onChange={(e) => handleCaseSelect(e.target.value)}
              className="bg-transparent text-cyber-text text-xs focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-cyber-card text-cyber-text">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
