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
  Sparkles,
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

    fetchInvestigation(investigationId)
      .then((inv) => {
        setInvestigation(inv);
        setActions(inv.actions || []);
        setIsPaused(inv.status === "paused");
        if (inv.current_hypothesis) setCurrentHypothesis(inv.current_hypothesis);
        refreshCaseData(inv.case_id);
      })
      .catch((err) => console.error("Failed to load investigation:", err));

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
      <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
        Loading Autonomous Investigation Center...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 rounded-[28px] border border-slate-200/80 shadow-sm">
      {/* Top Workspace Tab Bar */}
      <div className="h-14 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("trace")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "trace"
                ? "bg-[#111317] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-lime-400" />
            <span>Live Trace ({actions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "timeline"
                ? "bg-[#111317] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <FileSearch className="w-3.5 h-3.5 text-sky-400" />
            <span>Timeline ({timelineEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("process")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "process"
                ? "bg-[#111317] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            <span>Process Tree</span>
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "graph"
                ? "bg-[#111317] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <Network className="w-3.5 h-3.5 text-amber-400" />
            <span>Evidence Graph</span>
          </button>

          <button
            onClick={() => setActiveTab("findings")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "findings"
                ? "bg-[#111317] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
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
          className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>Export Forensic Report</span>
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
        <div className="lg:col-span-6 h-full overflow-hidden border-r border-slate-200/80 bg-white">
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
            <div className="p-4 sm:p-6 h-full">
              <EvidenceGraph
                graphData={evidenceGraphData}
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

        {/* Right Panel: Verified Findings Summary (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-hidden">
          <FindingsSummary
            findings={findings}
            onSelectEvidenceId={handleSelectEvidenceId}
          />
        </div>
      </div>

      {/* Evidence Drawer Overlay */}
      {selectedEvent && (
        <EvidenceDrawer
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Failure Injection Modal */}
      {isFailureModalOpen && (
        <FailureInjectionModal
          isOpen={isFailureModalOpen}
          onClose={() => setIsFailureModalOpen(false)}
          onSuccess={() => setIsFailureModalOpen(false)}
          investigationId={investigationId}
        />
      )}
    </div>
  );
}
