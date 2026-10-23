"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileSearch,
  Clock,
  GitBranch,
  Network,
  ShieldCheck,
  FolderOpen,
  Info,
  Layers,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import {
  fetchCases,
  fetchTimeline,
  fetchProcessTree,
  fetchEvidenceGraph,
  fetchFindings,
  fetchEvidenceEvent,
} from "@/lib/api";
import { Case, EvidenceEvent, Finding, ProcessTreeData } from "@/lib/types";

import { TimelineView } from "@/components/evidence/TimelineView";
import { ProcessTreeView } from "@/components/evidence/ProcessTreeView";
import { EvidenceGraph } from "@/components/evidence/EvidenceGraph";
import { FindingsBrowser } from "@/components/evidence/FindingsBrowser";
import { EvidenceDrawer } from "@/components/common/EvidenceDrawer";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

function EvidenceExplorerContent() {
  const searchParams = useSearchParams();
  const requestedCaseId = searchParams.get("case") || searchParams.get("caseId");

  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(requestedCaseId || "");
  const [activeTab, setActiveTab] = useState<"timeline" | "process" | "graph" | "findings">("timeline");

  const [events, setEvents] = useState<EvidenceEvent[]>([]);
  const [processTreeData, setProcessTreeData] = useState<ProcessTreeData | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EvidenceEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCases()
      .then((data) => {
        setCases(data);
        if (!selectedCaseId && data.length > 0) {
          const defaultCase = data[0];
          setSelectedCaseId(defaultCase.id);
        }
      })
      .catch((err) => console.error("Failed to load cases:", err));
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;

    setIsLoading(true);
    Promise.all([
      fetchTimeline(selectedCaseId).then(setEvents),
      fetchProcessTree(selectedCaseId).then(setProcessTreeData),
      fetchEvidenceGraph(selectedCaseId).then(setGraphData),
      fetchFindings(selectedCaseId).then(setFindings),
    ])
      .catch((err) => console.error("Error loading case evidence:", err))
      .finally(() => setIsLoading(false));
  }, [selectedCaseId]);

  const handleSelectEvidenceId = async (id: string) => {
    if (!selectedCaseId) return;
    try {
      const ev = await fetchEvidenceEvent(selectedCaseId, id);
      setSelectedEvent(ev);
    } catch (e) {
      console.error("Error fetching record:", e);
    }
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header & Perspective Selector (Inspired by Image 4 Pill Selector) */}
      <SpotlightCard className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Evidence Explorer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-lime-100 text-lime-800 border border-lime-200">
              4 Perspectives
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized investigation across telemetry, process lineage, and relational graphs.
          </p>
        </div>

        {/* Case Selector Dropdown Pill */}
        {cases.length > 0 ? (
          <div className="relative flex items-center">
            <FolderOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="pl-8 pr-8 py-2 text-xs font-semibold rounded-full bg-slate-100 border border-slate-200 text-slate-800 hover:border-slate-300 focus:outline-none cursor-pointer appearance-none shadow-sm max-w-[260px] truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.event_count || 0} events)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
          </div>
        ) : (
          <Link
            href="/investigations"
            className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-semibold"
          >
            <span>Intake First Case</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </SpotlightCard>

      {/* Perspective Navigation Pills (Matching Image 4 Category Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "timeline"
              ? "bg-[#111317] text-white shadow-md scale-[1.02]"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-sm"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-lime-400" />
          <span>1. Chronological Timeline</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700 font-bold">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("process")}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "process"
              ? "bg-[#111317] text-white shadow-md scale-[1.02]"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-sm"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-sky-400" />
          <span>2. Process Hierarchy</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700 font-bold">
            {processTreeData?.total_observed || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("graph")}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "graph"
              ? "bg-[#111317] text-white shadow-md scale-[1.02]"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-sm"
          }`}
        >
          <Network className="w-3.5 h-3.5 text-purple-400" />
          <span>3. Evidence Graph</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700 font-bold">
            {graphData?.nodes?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("findings")}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "findings"
              ? "bg-[#111317] text-white shadow-md scale-[1.02]"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-sm"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>4. Verified Findings</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700 font-bold">
            {findings.length}
          </span>
        </button>
      </div>

      {/* Main Perspective Content Box */}
      <div className="flex-1 min-h-0 bg-white rounded-[28px] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono animate-pulse">
            Loading forensic records and graph schemas...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {activeTab === "timeline" && (
              <TimelineView events={events} onSelectEvent={setSelectedEvent} />
            )}
            {activeTab === "process" && (
              <ProcessTreeView
                treeData={processTreeData}
                onSelectEvidenceId={handleSelectEvidenceId}
              />
            )}
            {activeTab === "graph" && (
              <div className="p-4 sm:p-6 h-full">
                <EvidenceGraph
                  graphData={graphData}
                  onSelectNode={(node) => {
                    if (node.id) handleSelectEvidenceId(node.id);
                  }}
                />
              </div>
            )}
            {activeTab === "findings" && (
              <FindingsBrowser
                findings={findings}
                onSelectEvidenceId={handleSelectEvidenceId}
              />
            )}
          </div>
        )}
      </div>

      {/* Evidence Record Drawer Overlay */}
      {selectedEvent && (
        <EvidenceDrawer
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

export default function EvidenceExplorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400 font-mono">Loading Evidence Explorer...</div>}>
      <EvidenceExplorerContent />
    </Suspense>
  );
}
