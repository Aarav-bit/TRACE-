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
} from "lucide-react";
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
          const defaultCase = data.find((c) => c.is_demo) || data[0];
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

  return (
    <div className="flex flex-col h-full bg-cyber-bg overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-cyber-border bg-cyber-card px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <FileSearch className="w-5 h-5 text-sky-400" />
          <h1 className="text-sm font-bold text-cyber-text tracking-wide">
            Evidence Explorer
          </h1>

          {/* Case Selector */}
          {cases.length > 0 && (
            <div className="flex items-center gap-2 bg-cyber-surface border border-cyber-border rounded px-2.5 py-1 text-xs ml-4">
              <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-transparent text-cyber-text font-mono text-xs focus:outline-none cursor-pointer"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id} className="bg-cyber-surface text-cyber-text">
                    {c.name} {c.is_demo ? "(Demo)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === "timeline"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab("process")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === "process"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Process Tree</span>
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === "graph"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Evidence Graph</span>
          </button>

          <button
            onClick={() => setActiveTab("findings")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === "findings"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Findings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-cyber-muted font-mono text-xs">
            Loading Case Artifact Telemetry...
          </div>
        ) : !selectedCaseId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
            <p className="text-sm font-semibold text-cyber-text">No Cases Found</p>
            <p className="text-xs text-cyber-dim">Create or intake a forensic case to explore timelines, process trees, and relational graphs.</p>
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
