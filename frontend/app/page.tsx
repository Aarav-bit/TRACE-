"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  HardDrive,
  CheckCircle2,
  Plus,
  Play,
  ArrowRight,
  ShieldCheck,
  Shield,
  FileSearch,
  Wrench,
  Settings,
  Layers,
  History,
  Sparkles,
} from "lucide-react";
import { fetchCases } from "@/lib/api";
import { Case } from "@/lib/types";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

export default function OverviewDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const totalArtifacts = cases.reduce((acc, c) => acc + (c.artifact_count || 0), 0);
  const totalFindings = cases.reduce((acc, c) => acc + (c.finding_count || 0), 0);
  const totalEvents = cases.reduce((acc, c) => acc + (c.event_count || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Bento Card (Matching Uploaded Image) */}
      <SpotlightCard className="p-8 sm:p-12 space-y-6">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-sm">
          <Shield className="w-3.5 h-3.5 fill-indigo-600/20 stroke-indigo-600" />
          <span>Autonomous Forensics &amp; Incident Verification Engine</span>
        </div>

        {/* Main Title & Subtitle */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Threat Reconstruction &amp; <br />
            Autonomous Cyber Evidence
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            TRACE transforms raw endpoint logs into audit-ready forensic explanations. An adaptive agent formulates investigative inquiries, follows telemetry leads, reconstructs execution hierarchies, and independently proves every finding against source records.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/investigations"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Investigation</span>
          </Link>

          <Link
            href="/investigations"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-700 text-slate-700" />
            <span>Load Attack Scenario</span>
          </Link>

          <Link
            href="/evidence"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/80 transition-all hover:scale-105 active:scale-95"
          >
            <FileSearch className="w-4 h-4 text-indigo-600" />
            <span>Explore Evidence</span>
          </Link>
        </div>

        {/* Feature Indicators along Bottom */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>100% Offline Engine Ready (Zero API Keys)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Cryptographic SHA-256 Provenance</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Deterministic Ground-Truth Verifier</span>
          </div>
        </div>
      </SpotlightCard>

      {/* 4 Metric Cards Row (Matching Uploaded Image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Active Investigations
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
              {cases.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Total cases in local forensic database
            </div>
          </div>
        </SpotlightCard>

        {/* Metric 2 */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Artifacts Ingested
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
              {totalArtifacts}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              EVTX, Sysmon JSON &amp; CSV logs
            </div>
          </div>
        </SpotlightCard>

        {/* Metric 3 */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Normalized Records
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
              {totalEvents}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Standardized UTC forensic events
            </div>
          </div>
        </SpotlightCard>

        {/* Metric 4 */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Verified Findings
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
              {totalFindings}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Claims validated against record UUIDs
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Forensic Workspaces & Sub-Screens Section (Matching Uploaded Image) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Forensic Workspaces &amp; Sub-Screens
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Access the dedicated modular investigation screens across the forensic pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Workspace 1: Case Intake */}
          <Link href="/investigations" className="group">
            <SpotlightCard className="p-5 h-full flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
                  <Compass className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Case Intake &amp; Ingestion
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Initialize cases, configure NVIDIA 120B / Local engine, and hash artifacts with SHA-256.
                </p>
              </div>
            </SpotlightCard>
          </Link>

          {/* Workspace 2: Evidence Explorer */}
          <Link href="/evidence" className="group">
            <SpotlightCard className="p-5 h-full flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                  <FileSearch className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Evidence Explorer
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Timeline, process ancestry trees, relational graphs, and independent claim validation.
                </p>
              </div>
            </SpotlightCard>
          </Link>

          {/* Workspace 3: Forensic Tools */}
          <Link href="/tools" className="group">
            <SpotlightCard className="p-5 h-full flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/60">
                  <Wrench className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Forensic Tool Registry
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  The Sleuth Kit (TSK CLI), Autopsy CLI, Volatility 3 v2.28.2, and bridge mode adapter controls.
                </p>
              </div>
            </SpotlightCard>
          </Link>

          {/* Workspace 4: Settings & AI */}
          <Link href="/settings" className="group">
            <SpotlightCard className="p-5 h-full flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60">
                  <Settings className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Settings &amp; AI Engine
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  NVIDIA NIM API key credentials, Nemotron 120B model selection, and database controls.
                </p>
              </div>
            </SpotlightCard>
          </Link>
        </div>
      </div>

      {/* Forensic Case Ledger Table */}
      <SpotlightCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Active Forensic Cases
            </h2>
            <p className="text-xs text-slate-500">
              Select an investigation to explore chronological timeline and process ancestry trees.
            </p>
          </div>

          <Link
            href="/history"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono animate-pulse">
            Loading investigation records...
          </div>
        ) : cases.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
            <HardDrive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Forensic Cases Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Drop <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">incident_triage_evidence.json</code> into Case Intake to begin autonomous investigation.
            </p>
            <Link
              href="/investigations"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Case</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Case Target</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Artifacts</th>
                  <th className="pb-3">Indexed Events</th>
                  <th className="pb-3">Verified Claims</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 pl-2 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center font-bold text-xs font-mono">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                            {c.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {c.status || "Active"}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-600 font-medium">
                      {c.artifact_count || 0} files
                    </td>

                    <td className="py-3.5 text-slate-600 font-mono font-medium">
                      {c.event_count || 0} events
                    </td>

                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{c.finding_count || 0}</span>
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-400 text-[11px] font-mono">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Today"}
                    </td>

                    <td className="py-3.5 text-right pr-2">
                      <Link
                        href={`/evidence?case=${c.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 transition-all shadow-sm"
                        title="Explore Evidence"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
