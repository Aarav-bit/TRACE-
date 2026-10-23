"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Play,
  Plus,
  Compass,
  FileSearch,
  CheckCircle2,
  HardDrive,
  FileText,
  AlertTriangle,
  Download,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import {
  fetchCases,
  seedDemoCase,
  startInvestigation,
  getSampleEvidenceDownloadUrl,
} from "@/lib/api";
import { Case } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function OverviewDashboard() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunchingBenchmark, setIsLaunchingBenchmark] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCases();
      setCases(data);
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBenchmark = async (type: "complete" | "degraded") => {
    setIsLaunchingBenchmark(true);
    try {
      const seedRes = await seedDemoCase(type);
      const inv = await startInvestigation(seedRes.case_id, {
        mode: "deterministic",
      });
      router.push(`/investigations/${inv.id}`);
    } catch (err) {
      console.error("Failed to start benchmark:", err);
    } finally {
      setIsLaunchingBenchmark(false);
    }
  };

  const totalArtifacts = cases.reduce((acc, c) => acc + (c.artifact_count || 0), 0);
  const totalFindings = cases.reduce((acc, c) => acc + (c.finding_count || 0), 0);
  const totalEvents = cases.reduce((acc, c) => acc + (c.event_count || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="rounded-xl border border-cyber-border bg-gradient-to-r from-cyber-card via-cyber-surface to-cyber-card p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-sky-950/30 to-transparent pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-700/60 text-sky-300 text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            <span>Autonomous DFIR & Threat Reconstruction Platform</span>
          </div>

          <h1 className="text-3xl font-extrabold text-cyber-text tracking-tight sm:text-4xl">
            Don&apos;t just detect alerts. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-400">
              Investigate, correlate, verify, explain.
            </span>
          </h1>

          <p className="text-sm text-cyber-muted leading-relaxed">
            TRACE ingest raw endpoint telemetry (Windows Security EVTX, Sysmon logs, command executions, and triage archives),
            plans an adaptive forensic investigation, reconstructs parent-child execution lineages, and independently
            validates all conclusions against source evidence records before generating audit-ready forensic reports.
          </p>

          {/* Primary Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/investigations"
              className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs tracking-wide flex items-center gap-2 shadow-lg shadow-sky-950/50 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Case & Upload Evidence</span>
            </Link>

            <a
              href={getSampleEvidenceDownloadUrl()}
              download="incident_triage_bundle.zip"
              className="px-4 py-2.5 rounded-lg bg-cyber-surface hover:bg-cyber-panel border border-sky-600/60 text-sky-300 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Download Presentation Evidence (.zip)</span>
            </a>

            <button
              onClick={() => handleRunBenchmark("complete")}
              disabled={isLaunchingBenchmark}
              className="px-4 py-2.5 rounded-lg bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-text font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>{isLaunchingBenchmark ? "Launching..." : "Benchmark Case"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-cyber-dim uppercase tracking-wider block">
              Active Cases
            </span>
            <span className="text-2xl font-bold font-mono text-cyber-text mt-1 block">
              {cases.length}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-cyber-dim uppercase tracking-wider block">
              Ingested Artifacts
            </span>
            <span className="text-2xl font-bold font-mono text-cyber-text mt-1 block">
              {totalArtifacts}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-cyber-surface text-cyber-muted border border-cyber-border">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-cyber-dim uppercase tracking-wider block">
              Normalized Records
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              {totalEvents}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-cyber-dim uppercase tracking-wider block">
              Substantiated Findings
            </span>
            <span className="text-2xl font-bold font-mono text-sky-400 mt-1 block">
              {totalFindings}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-cyber-text tracking-wide">
              Recent Incident Investigations
            </h2>
            <p className="text-xs text-cyber-dim font-mono">
              Persistent cases managed in local SQLite evidence repository
            </p>
          </div>
          <Link
            href="/investigations"
            className="text-xs text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1"
          >
            Create Case &rarr;
          </Link>
        </div>

        {cases.length === 0 ? (
          <div className="p-12 rounded-xl bg-cyber-card border border-cyber-border text-center space-y-3">
            <Compass className="w-8 h-8 text-cyber-dim mx-auto" />
            <h3 className="text-sm font-semibold text-cyber-text">No cases created yet</h3>
            <p className="text-xs text-cyber-dim max-w-sm mx-auto">
              Click &quot;Start New Case & Upload Evidence&quot; to ingest your first forensic log file.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-cyber-border bg-cyber-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-surface/60 font-mono text-[11px] text-cyber-dim uppercase">
                    <th className="p-3.5 pl-5">Case Identifier</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Artifacts Ingested</th>
                    <th className="p-3.5">Verified Claims</th>
                    <th className="p-3.5">Created Date</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/60">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-cyber-surface/40 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-semibold text-cyber-text flex items-center gap-2">
                          <span>{c.name}</span>
                          {c.demo_type === "degraded" && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                              DEGRADED BENCHMARK
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-cyber-dim">
                          UUID: {c.id}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="p-3.5 font-mono text-cyber-muted">
                        {c.artifact_count} file{c.artifact_count === 1 ? "" : "s"} ({c.event_count} records)
                      </td>
                      <td className="p-3.5 font-mono text-sky-400 font-bold">
                        {c.finding_count} verified
                      </td>
                      <td className="p-3.5 font-mono text-cyber-dim">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/evidence?caseId=${c.id}`}
                            className="px-2.5 py-1 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs transition-colors"
                          >
                            Explore Evidence
                          </Link>
                          <Link
                            href={`/api/cases/${c.id}/report/html`}
                            target="_blank"
                            className="px-2.5 py-1 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-sky-400 text-xs transition-colors"
                          >
                            Report
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
