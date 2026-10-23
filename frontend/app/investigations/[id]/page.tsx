"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  Compass,
  FileSearch,
  GitBranch,
  Network,
  ShieldCheck,
  FileText,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  fetchInvestigation,
  pauseInvestigation,
  resumeInvestigation,
  stopInvestigation,
  fetchTimeline,
  fetchProcessTree,
  fetchEvidenceGraph,
  fetchFindings,
  fetchEvidenceEvent,
  getInvestigationEventsUrl,
  getReportHtmlUrl,
} from "@/lib/api";
import {
  Investigation,
  InvestigationAction,
  EvidenceEvent,
  Finding,
  ProcessTreeData,
} from "@/lib/types";

// Import Panels & Tabs
import { PlanPanel } from "@/components/investigation/PlanPanel";
import { LiveTrace } from "@/components/investigation/LiveTrace";
import { FindingsSummary } from "@/components/investigation/FindingsSummary";
import { TimelineView } from "@/components/evidence/TimelineView";
import { ProcessTreeView } from "@/components/evidence/ProcessTreeView";
import { EvidenceGraph } from "@/components/evidence/EvidenceGraph";
import { FindingsBrowser } from "@/components/evidence/FindingsBrowser";
import { EvidenceDrawer } from "@/components/common/EvidenceDrawer";
import { FailureInjectionModal } from "@/components/common/FailureInjectionModal";

export default function LiveInvestigationCenter() {
  const params = useParams();
  const router = useRouter();
  const investigationId = params.id as string;

  // Investigation & SSE state
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [actions, setActions] = useState<InvestigationAction[]>([]);
  const [currentPhase, setCurrentPhase] = useState("Reconnaissance");
  const [currentHypothesis, setCurrentHypothesis] = useState("Formulating investigative hypothesis...");
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"trace" | "timeline" | "process" | "graph" | "findings">("trace");

  // Evidence data for tabs
  const [timelineEvents, setTimelineEvents] = useState<EvidenceEvent[]>([]);
  const [processTreeData, setProcessTreeData] = useState<ProcessTreeData | null>(null);
  const [evidenceGraphData, setEvidenceGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);

  // Selected Evidence for Drawer
  const [selectedEvent, setSelectedEvent] = useState<EvidenceEvent | null>(null);

  // Failure Injection Modal
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);

  // SSE EventSource reference
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!investigationId) return;

    // Load initial investigation state from DB
    fetchInvestigation(investigationId)
      .then((inv) => {
        setInvestigation(inv);
        setActions(inv.actions || []);
        setIsPaused(inv.status === "paused");
        if (inv.current_hypothesis) setCurrentHypothesis(inv.current_hypothesis);

        // Load associated evidence data
        refreshCaseData(inv.case_id);
      })
      .catch((err) => console.error("Failed to load investigation:", err));

    // Connect Server-Sent Events (SSE)
    const eventsUrl = getInvestigationEventsUrl(investigationId);
    const es = new EventSource(eventsUrl);
    sseRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.hypothesis) setCurrentHypothesis(payload.hypothesis);
        if (payload.phase) setCurrentPhase(payload.phase);

        if (payload.type === "action_started") {
          const newAct = payload.action;
          setActions((prev) => {
            if (prev.some((a) => a.id === newAct.id)) return prev;
            return [...prev, newAct];
          });
        } else if (payload.type === "action_completed" || payload.type === "action_failed") {
          const finishedAct = payload.action;
          setActions((prev) =>
            prev.map((a) => (a.id === finishedAct.id || a.sequence_number === finishedAct.sequence_number ? { ...a, ...finishedAct } : a))
          );
          // Refresh findings and graph as new actions complete
          if (investigation?.case_id) {
            refreshCaseData(investigation.case_id);
          }
        } else if (payload.type === "investigation_completed") {
          setInvestigation((prev) => (prev ? { ...prev, status: "completed" } : null));
          if (investigation?.case_id) refreshCaseData(investigation.case_id);
        } else if (payload.type === "investigation_paused") {
          setIsPaused(true);
        } else if (payload.type === "investigation_resumed") {
          setIsPaused(false);
        } else if (payload.type === "investigation_stopped") {
          setInvestigation((prev) => (prev ? { ...prev, status: "stopped" } : null));
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
    };
  }, [investigationId]);

  const refreshCaseData = (caseId: string) => {
    fetchTimeline(caseId).then(setTimelineEvents).catch(() => {});
    fetchProcessTree(caseId).then(setProcessTreeData).catch(() => {});
    fetchEvidenceGraph(caseId).then(setEvidenceGraphData).catch(() => {});
    fetchFindings(caseId).then(setFindings).catch(() => {});
  };

  const handlePause = async () => {
    await pauseInvestigation(investigationId);
    setIsPaused(true);
  };

  const handleResume = async () => {
    await resumeInvestigation(investigationId);
    setIsPaused(false);
  };

  const handleStop = async () => {
    await stopInvestigation(investigationId);
  };

  const handleSelectEvidenceId = async (id: string) => {
    if (!investigation) return;
    try {
      const ev = await fetchEvidenceEvent(investigation.case_id, id);
      setSelectedEvent(ev);
    } catch (err) {
      console.error("Failed to load evidence record:", err);
    }
  };

  if (!investigation) {
    return (
      <div className="flex items-center justify-center h-full text-cyber-muted font-mono text-xs">
        Loading Investigation Workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-cyber-bg">
      {/* Top Workspace Tab Bar */}
      <div className="h-12 border-b border-cyber-border bg-cyber-card px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab("trace")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
              activeTab === "trace"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Live Trace ({actions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
              activeTab === "timeline"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <FileSearch className="w-3.5 h-3.5 text-sky-400" />
            <span>Timeline ({timelineEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("process")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
              activeTab === "process"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-sky-400" />
            <span>Process Tree</span>
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
              activeTab === "graph"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <Network className="w-3.5 h-3.5 text-sky-400" />
            <span>Evidence Graph</span>
          </button>

          <button
            onClick={() => setActiveTab("findings")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
              activeTab === "findings"
                ? "bg-sky-950 text-sky-400 font-bold border border-sky-800"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Findings ({findings.length})</span>
          </button>
        </div>

        {/* Report Export Button */}
        <a
          href={getReportHtmlUrl(investigation.case_id)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-xs text-sky-400 font-mono font-medium flex items-center gap-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </a>
      </div>

      {/* 3-Column Incident Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Panel: Plan, Hypothesis & Controls (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-hidden">
          <PlanPanel
            investigation={investigation}
            currentPhase={currentPhase}
            currentHypothesis={currentHypothesis}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onOpenFailureInjection={() => setIsFailureModalOpen(true)}
          />
        </div>

        {/* Center Panel: Active Tab View (6 cols) */}
        <div className="lg:col-span-6 h-full overflow-hidden border-r border-cyber-border">
          {activeTab === "trace" && (
            <LiveTrace
              actions={actions}
              isConnected={isConnected}
              onSelectEvidenceId={handleSelectEvidenceId}
            />
          )}

          {activeTab === "timeline" && (
            <TimelineView
              events={timelineEvents}
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
              graphData={evidenceGraphData}
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
        </div>

        {/* Right Panel: Verified Findings & Entities (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-hidden">
          <FindingsSummary
            findings={findings}
            onSelectEvidenceId={handleSelectEvidenceId}
          />
        </div>
      </div>

      {/* Slide-over Evidence Drawer */}
      <EvidenceDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Demo Failure Injection Modal */}
      <FailureInjectionModal
        investigationId={investigation.id}
        isOpen={isFailureModalOpen}
        onClose={() => setIsFailureModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
