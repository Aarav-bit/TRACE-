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
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
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

function EvidenceExplorerContent() {
  const searchParams = useSearchParams();
  const requestedCaseId = searchParams.get("caseId");

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
    <div className="flex flex-col h-full bg-cyber-bg overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-16 border-b border-cyber-border bg-cyber-card px-6 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-sky-400" />
            <h1 className="text-sm font-bold text-cyber-text tracking-wide">
              Evidence Explorer &amp; Forensic Perspectives
            </h1>
          </div>
          <p className="text-[11px] text-cyber-muted font-mono mt-0.5">
            Four synchronized investigative perspectives across raw telemetry, process lineage, and relational graphs
          </p>
        </div>

        {/* Case Selector Dropdown */}
        {cases.length > 0 ? (
          <div className="flex items-center gap-2 bg-cyber-surface border border-cyber-border rounded-lg px-3 py-1.5 text-xs">
            <FolderOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-cyber-dim font-mono text-[11px] uppercase">Case:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-transparent text-cyber-text font-medium text-xs focus:outline-none cursor-pointer max-w-[240px] truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-cyber-card text-cyber-text">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Link
            href="/investigations"
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Intake First Case</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Perspective Navigation Tabs */}
      <div className="border-b border-cyber-border bg-cyber-card/60 px-6 py-2 flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2">
          {/* Timeline Tab */}
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "timeline"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/40 font-semibold shadow-sm"
                : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/60 border border-transparent"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>1. Chronological Timeline</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-surface text-cyber-dim">
              {events.length}
            </span>
          </button>

          {/* Process Tree Tab */}
          <button
            onClick={() => setActiveTab("process")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "process"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/40 font-semibold shadow-sm"
                : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/60 border border-transparent"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-sky-400" />
            <span>2. Process Hierarchy</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-surface text-cyber-dim">
              {processTreeData?.total_observed || 0}
            </span>
          </button>

          {/* Evidence Graph Tab */}
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "graph"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/40 font-semibold shadow-sm"
                : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/60 border border-transparent"
            }`}
          >
            <Network className="w-3.5 h-3.5 text-sky-400" />
            <span>3. Evidence Graph</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-surface text-cyber-dim">
              {graphData?.nodes?.length || 0}
            </span>
          </button>

          {/* Findings Tab */}
          <button
            onClick={() => setActiveTab("findings")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "findings"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-semibold shadow-sm"
                : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/60 border border-transparent"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. Verified Findings</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-400">
              {findings.length}
            </span>
          </button>
        </div>

        {/* Perspective Quick Explanation */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-cyber-dim">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>
            {activeTab === "timeline" && "Minute-by-minute normalized UTC incident narrative"}
            {activeTab === "process" && "Parent-child process execution tree & command lines"}
            {activeTab === "graph" && "Visual relational graph linking users, processes, files & network sockets"}
            {activeTab === "findings" && "Factual conclusions validated by independent deterministic verifier"}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-cyber-muted space-y-2">
            <span className="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin block" />
            <span className="text-xs font-mono text-cyber-dim">Loading Forensic Perspectives...</span>
          </div>
        ) : !selectedCaseId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyber-card border border-cyber-border flex items-center justify-center text-sky-400">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cyber-text">No Forensic Cases Available</p>
              <p className="text-xs text-cyber-dim mt-0.5 max-w-sm">
                Establish an incident case under Case Intake to explore chronological timelines, process trees, and relational graphs.
              </p>
            </div>
            <Link
              href="/investigations"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors shadow-sm"
            >
              Start New Case
            </Link>
          </div>
        ) : (
          <>
            {activeTab === "timeline" && (
              <TimelineView
                events={events}
                onSelectEvent={(ev) => setSelectedEvent(ev)}
              />
            )}

            {activeTab === "process" && (
              <ProcessTreeView
                treeData={processTreeData}
                onSelectEvidenceId={handleSelectEvidenceId}
              />
            )}

            {activeTab === "graph" && (
              <EvidenceGraph
                graphData={graphData}
                onSelectNode={(node) => {
                  if (node?.metadata?.evidence_id) {
                    handleSelectEvidenceId(node.metadata.evidence_id);
                  }
                }}
              />
            )}

            {activeTab === "findings" && (
              <FindingsBrowser
                findings={findings}
                onSelectEvidenceId={handleSelectEvidenceId}
              />
            )}
          </>
        )}
      </div>

      {/* Slide-over Evidence Detail Drawer */}
      <EvidenceDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

export default function EvidenceExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-cyber-muted font-mono text-xs">
          Loading Evidence Workspace...
        </div>
      }
    >
      <EvidenceExplorerContent />
    </Suspense>
  );
}
