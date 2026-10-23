"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  FileCheck2,
  HardDrive,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { fetchCases } from "@/lib/api";
import { Case } from "@/lib/types";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { DecryptedText } from "@/components/reactbits/DecryptedText";
import { CircularGauge } from "@/components/reactbits/CircularGauge";
import { GradientCard } from "@/components/reactbits/GradientCard";

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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Greeting & Header (Inspired by Image 1 & 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Forensic Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-lime-100 text-lime-800 border border-lime-200">
              Autonomous
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reconstruct threat sequences, correlate timeline telemetry, and verify claims.
          </p>
        </div>

        {/* Quick action pill button */}
        <div className="flex items-center gap-3">
          <Link
            href="/investigations"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111317] hover:bg-black text-white text-xs font-semibold shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4 text-lime-400" />
            <span>Start Investigation</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Top Section: 3 Tiles (Inspired by Image 1 & 2) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Tile 1: Statistics & Mini Chart (Span 4) */}
        <SpotlightCard className="md:col-span-4 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Telemetry Volume
              </span>
              <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
                {totalEvents}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Indexed Events
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-lime-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{cases.length} active case{cases.length === 1 ? "" : "s"} indexed</span>
            </div>
          </div>

          {/* Mini Column Bar Chart (Like Nov Dec Jan in Image 1 & Mon Tue Wed in Image 2) */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-[11px] font-medium text-slate-400 mb-2 flex justify-between">
              <span>Artifact Distribution</span>
              <span className="font-semibold text-slate-600">{totalArtifacts} files</span>
            </div>
            <div className="flex items-end gap-2 h-14">
              <div className="flex-1 bg-slate-200 rounded-t-lg h-[40%] transition-all hover:bg-slate-300" title="JSON Logs" />
              <div className="flex-1 bg-lime-300 rounded-t-lg h-[85%] transition-all hover:bg-lime-400" title="Sysmon EID 1/3" />
              <div className="flex-1 bg-sky-300 rounded-t-lg h-[65%] transition-all hover:bg-sky-400" title="Windows EVTX 4688" />
              <div className="flex-1 bg-indigo-300 rounded-t-lg h-[50%] transition-all hover:bg-indigo-400" title="Disk Inodes (TSK)" />
              <div className="flex-1 bg-amber-300 rounded-t-lg h-[95%] transition-all hover:bg-amber-400" title="Memory Pools (Vol3)" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
              <span>JSON</span>
              <span>SYSMON</span>
              <span>EVTX</span>
              <span>TSK</span>
              <span>VOL3</span>
            </div>
          </div>
        </SpotlightCard>

        {/* Tile 2: NVIDIA NIM Engine Card (The Card from Image 1, Span 5) */}
        <div className="md:col-span-5 flex">
          <GradientCard
            modelName="nvidia/nemotron-3.5-super-vl-120b"
            mode="adaptive"
            activeCase={cases[0]?.name || "Ready For Case Intake"}
            isOnline={true}
          />
        </div>

        {/* Tile 3: Circular Verification Gauge (The Ring from Image 2, Span 3) */}
        <SpotlightCard className="md:col-span-3 p-6 flex flex-col items-center justify-between text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Verifier Score
            </span>
            <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
          </div>

          <div className="my-2">
            <CircularGauge
              value={96}
              label="96%"
              sublabel="Causal Proof"
              size={110}
              strokeWidth={10}
              color="#a3e635"
            />
          </div>

          <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified Findings</span>
            <span className="font-bold text-slate-800">{totalFindings}</span>
          </div>
        </SpotlightCard>
      </div>

      {/* Bento Bottom Section: Recent Cases Table (Inspired by Image 1 & 2 Tables) */}
      <SpotlightCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Forensic Case Records
            </h2>
            <p className="text-xs text-slate-500">
              Select an investigation to explore chronological timeline and process ancestry trees.
            </p>
          </div>

          <Link
            href="/history"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table or Empty State */}
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
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-lime-400" />
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
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs font-mono">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                            {c.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Pill Badge (Pastel colored like Image 2 & 4) */}
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
                        <CheckCircle2 className="w-3.5 h-3.5 text-lime-600" />
                        <span>{c.finding_count || 0}</span>
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-400 text-[11px] font-mono">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Today"}
                    </td>

                    <td className="py-3.5 text-right pr-2">
                      <Link
                        href={`/evidence?case=${c.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-700 transition-all shadow-sm"
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
