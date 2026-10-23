"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  Search,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { fetchCases } from "@/lib/api";
import { Case } from "@/lib/types";

interface TopBarProps {
  currentTitle?: string;
  activeCaseId?: string;
  onCaseChange?: (caseId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTitle = "Dashboard",
  activeCaseId,
  onCaseChange,
}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>(activeCaseId || "");
  const [searchQuery, setSearchQuery] = useState("");

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
    <header className="h-16 px-6 sm:px-8 flex items-center justify-between shrink-0 select-none border-b border-slate-200/70 bg-white/70 backdrop-blur-md sticky top-0 z-20">
      {/* Left: Section Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-400 border border-lime-500 shadow-sm" />
          <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">
            TRACE
          </span>
        </div>
        <span className="text-slate-300 font-mono text-sm">/</span>
        <h1 className="text-sm font-semibold text-slate-700 capitalize">
          {currentTitle}
        </h1>
      </div>

      {/* Center: Search Pill (Inspired by Image 1, 2, 3) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search processes, hashes, MITRE techniques..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-slate-100/80 border border-slate-200/80 focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-inner"
          />
        </div>
      </div>

      {/* Right: Actions, Case Switcher & New Case Button */}
      <div className="flex items-center gap-3">
        {/* Active Case Dropdown Pill */}
        <div className="relative flex items-center">
          <FolderOpen className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={selectedCase}
            onChange={(e) => handleCaseSelect(e.target.value)}
            className="pl-8 pr-7 py-1.5 text-xs font-medium rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all cursor-pointer appearance-none shadow-sm"
          >
            {cases.length === 0 ? (
              <option value="">No Active Cases</option>
            ) : (
              cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.event_count || 0} events)
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Engine Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-50 border border-lime-200/80 text-[11px] font-medium text-lime-900 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-lime-600" />
          <span>Nemotron 120B Ready</span>
        </div>

        {/* + Start New Case Pill Button */}
        <Link
          href="/investigations"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111317] text-white text-xs font-semibold hover:bg-black hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-slate-900/10"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Case</span>
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
