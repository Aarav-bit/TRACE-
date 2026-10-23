"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  FileCheck2,
  HardDrive,
  CheckCircle2,
  Download,
  Plus,
  Play,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { fetchCases, seedDemoCase, getSampleEvidenceDownloadUrl } from "@/lib/api";
import { Case } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function OverviewDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunchingBenchmark, setIsLaunchingBenchmark] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await fetchCases();
      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBenchmark = async (caseType: "complete" | "degraded") => {
    setIsLaunchingBenchmark(true);
    try {
      const res = await seedDemoCase(caseType);
      if (res && res.case_id) {
        window.location.href = `/investigations`;
      }
    } catch (e) {
      console.error("Failed to seed benchmark case:", e);
    } finally {
      setIsLaunchingBenchmark(false);
    }
  };

  const totalArtifacts = cases.reduce((acc, c) => acc + (c.artifact_count || 0), 0);
  const totalFindings = cases.reduce((acc, c) => acc + (c.finding_count || 0), 0);
  const totalEvents = cases.reduce((acc, c) => acc + (c.event_count || 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Card */}
      <div className="rounded-xl border border-cyber-border bg-cyber-card p-6 md:p-8 space-y-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-950/50 border border-sky-800/60 text-sky-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Autonomous Digital Forensics Investigator</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-cyber-text tracking-tight">
            Threat Reconstruction &amp; Autonomous Cyber Evidence
          </h1>

          <p className="text-xs sm:text-sm text-cyber-muted leading-relaxed max-w-2xl">
            TRACE ingests raw endpoint telemetry, plans investigative inquiries, reconstructs process ancestry trees, and independently validates claims against primary evidence records before generating audit-ready forensic reports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/investigations"
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs tracking-wide flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Case</span>
          </Link>

          <a
            href={getSampleEvidenceDownloadUrl()}
            download="incident_triage_bundle.zip"
            className="px-4 py-2 rounded-lg bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-cyber-text font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Download Presentation Evidence (.zip)</span>
          </a>

          <button
            onClick={() => handleRunBenchmark("complete")}
            disabled={isLaunchingBenchmark}
            className="px-4 py-2 rounded-lg bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-text font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isLaunchingBenchmark ? "Launching..." : "Run Benchmark Case"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border">
          <div className="flex items-center justify-between text-cyber-dim mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active Cases</span>
            <Compass className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyber-text">{cases.length}</div>
        </div>

        <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border">
          <div className="flex items-center justify-between text-cyber-dim mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Artifacts</span>
            <HardDrive className="w-4 h-4 text-cyber-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyber-text">{totalArtifacts}</div>
        </div>

        <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border">
          <div className="flex items-center justify-between text-cyber-dim mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Normalized Records</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{totalEvents}</div>
        </div>

        <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border">
          <div className="flex items-center justify-between text-cyber-dim mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Verified Findings</span>
            <FileCheck2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">{totalFindings}</div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-cyber-text">Recent Forensic Investigations</h2>
            <p className="text-xs text-cyber-dim">All cases are recorded with cryptographic SHA-256 provenance</p>
          </div>
          <Link
            href="/investigations"
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Intake New Case</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-cyber-dim bg-cyber-card rounded-lg border border-cyber-border">
            Loading investigation records...
          </div>
        ) : cases.length === 0 ? (
          <div className="p-10 text-center rounded-xl border border-dashed border-cyber-border bg-cyber-card space-y-2">
            <p className="text-sm font-semibold text-cyber-text">No cases currently active</p>
            <p className="text-xs text-cyber-dim">Click &quot;Start New Case&quot; to ingest your first forensic log file.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-cyber-border bg-cyber-card overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-cyber-border bg-cyber-surface/40 font-mono text-[10px] text-cyber-dim uppercase">
                  <th className="p-3 pl-4">Case Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Artifacts &amp; Records</th>
                  <th className="p-3">Verified Findings</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/60">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-cyber-surface/30 transition-colors">
                    <td className="p-3 pl-4">
                      <div className="font-medium text-cyber-text">{c.name}</div>
                      <span className="text-[10px] font-mono text-cyber-dim">
                        {c.id.substring(0, 18)}...
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="p-3 font-mono text-cyber-muted text-[11px]">
                      {c.artifact_count} file{c.artifact_count === 1 ? "" : "s"} &bull; {c.event_count} events
                    </td>
                    <td className="p-3 font-mono text-sky-400 font-bold text-[11px]">
                      {c.finding_count} verified
                    </td>
                    <td className="p-3 font-mono text-cyber-dim text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/evidence?caseId=${c.id}`}
                          className="px-2.5 py-1 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs transition-colors"
                        >
                          Evidence
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
        )}
      </div>
    </div>
  );
}
