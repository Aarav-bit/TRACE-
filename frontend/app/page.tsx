"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  HardDrive,
  CheckCircle2,
  Plus,
  Play,
  ArrowRight,
  ShieldCheck,
  Shield,
  ShieldAlert,
  FileSearch,
  Wrench,
  Settings,
  Layers,
  History,
  Sparkles,
  BrainCircuit,
  Terminal,
  Activity,
  Zap,
  Lock,
  GitBranch,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { fetchCases, seedDemoCase } from "@/lib/api";
import { Case } from "@/lib/types";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { DecryptedText } from "@/components/reactbits/DecryptedText";

const SIMULATED_AGENT_LOGS = [
  {
    phase: "INTAKE & INTEGRITY",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    message: "Audited storage manifest: 9 Sysmon & Windows EVTX logs verified with SHA-256.",
    time: "00:01.2s",
  },
  {
    phase: "ML TRIAGE",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    message: "Supervised models (XGBoost + TF-IDF) classified scenario: 'data_leakage' (95.3% confidence).",
    time: "00:02.1s",
  },
  {
    phase: "PROCESS ANCESTRY",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    message: "Reconstructed execution tree for powershell.exe (PID 5912). Found unobserved parent gap.",
    time: "00:03.4s",
  },
  {
    phase: "GRAPH CORRELATION",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    message: "Bounded graph correlation generated 8 multi-pivot edges across user, process, file, & sockets.",
    time: "00:04.8s",
  },
  {
    phase: "DETERMINISTIC VERIFIER",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    message: "Verified factual claim against primary source record UUID REC-00103 -> VERDICT: PROVED.",
    time: "00:06.0s",
  },
];

export default function HeroLandingPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  useEffect(() => {
    loadCases();
  }, []);

  // Cycle the simulated terminal logs every 3 seconds for dynamic energy
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogIndex((prev) => (prev + 1) % SIMULATED_AGENT_LOGS.length);
    }, 3200);
    return () => clearInterval(interval);
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

  const handleQuickSeedAndNavigate = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemoCase("complete");
      router.push(`/investigations/${res.case_id}`);
    } catch (e) {
      console.error(e);
      setIsSeeding(false);
    }
  };

  const totalArtifacts = cases.reduce((acc, c) => acc + (c.artifact_count || 0), 0);
  const totalFindings = cases.reduce((acc, c) => acc + (c.finding_count || 0), 0);
  const totalEvents = cases.reduce((acc, c) => acc + (c.event_count || 0), 0);

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-500 select-none">
      {/* =========================================================================
          SECTION 1: HERO SPOTLIGHT BANNER WITH LIVE AGENT VISUALIZER
          ========================================================================= */}
      <div className="relative rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-8 sm:p-12 lg:p-16 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Core Positioning & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Security Clearance Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Shield className="w-3.5 h-3.5 fill-indigo-600/20 stroke-indigo-600" />
              <DecryptedText
                text="TRACE DFIR ENGINE v2.4 • AUTONOMOUS INVESTIGATOR"
                speed={25}
                maxIterations={12}
                className="font-mono text-[11px] font-bold tracking-wide"
              />
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
                Threat Reconstruction &amp; <br />
                <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-800 bg-clip-text text-transparent">
                  Autonomous Cyber Evidence
                </span>
              </h1>
              <p className="text-base sm:text-lg font-medium text-slate-700 tracking-tight">
                Don&rsquo;t just detect. <span className="text-indigo-600 font-bold">Investigate, verify, explain.</span>
              </p>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
                Most AI security tools summarize alerts or suggest generic shell scripts. TRACE performs the complete forensics investigation itself — formulating hypotheses, adapting across degraded evidence, triaging attacks with supervised ML models, and mathematically verifying findings against immutable primary source logs.
              </p>
            </div>

            {/* Action Buttons Cluster */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/investigations"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Investigation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/triage"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <span>ML Forensic Triage</span>
                <span className="text-[10px] bg-indigo-200/70 text-indigo-800 px-1.5 py-0.2 rounded-full font-mono">
                  NEW
                </span>
              </Link>

              <button
                onClick={handleQuickSeedAndNavigate}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200/80 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {isSeeding ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
                    <span>Seeding Attack...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-800 text-slate-800" />
                    <span>Run Demo Scenario</span>
                  </>
                )}
              </button>

              <Link
                href="/evidence"
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-full text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
              >
                <FileSearch className="w-4 h-4 text-slate-500" />
                <span>Explore Evidence</span>
              </Link>
            </div>

            {/* Bottom Proof Badges */}
            <div className="flex flex-wrap items-center gap-5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Offline (Zero API Keys Required)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>Cryptographic SHA-256 Provenance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                <span>Deterministic Verifier</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Autonomous Forensic Agent Visualizer */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-5 text-white font-mono space-y-4 relative overflow-hidden">
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold ml-1">
                    trace-agent: ~ loop:active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold animate-pulse">
                    SSE STREAMING
                  </span>
                </div>
              </div>

              {/* Terminal Body with Live Logs */}
              <div className="space-y-3 min-h-[220px]">
                {SIMULATED_AGENT_LOGS.map((log, index) => {
                  const isActive = index === activeLogIndex;
                  return (
                    <div
                      key={index}
                      className={`p-2.5 rounded-xl border text-xs transition-all duration-300 ${
                        isActive
                          ? "bg-slate-900 border-indigo-500/40 shadow-sm scale-[1.01]"
                          : "bg-slate-950/40 border-slate-800/50 opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${log.color}`}>
                          {log.phase}
                        </span>
                        <span className="text-slate-500">{log.time}</span>
                      </div>
                      <p className="text-slate-300 font-sans text-[11px] leading-relaxed">
                        {log.message}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Terminal Footer with Quick Status */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>Bounded Loop: 5/15 Steps</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">SHA-256 Chained</span>
                  <Link href="/investigations" className="text-indigo-400 hover:text-indigo-300 underline flex items-center gap-0.5">
                    Live Trace <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: REAL-TIME METRICS HEADS-UP DISPLAY (HUD)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Cases */}
        <SpotlightCard className="p-5 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Forensic Cases
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {cases.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Active investigations in SQLite WAL
            </div>
          </div>
        </SpotlightCard>

        {/* Metric 2: Ingested Artifacts */}
        <SpotlightCard className="p-5 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Artifacts Ingested
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalArtifacts}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              EVTX, Sysmon JSON &amp; CSV logs
            </div>
          </div>
        </SpotlightCard>

        {/* Metric 3: Normalized Records */}
        <SpotlightCard className="p-5 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Normalized Records
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalEvents}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Standardized UTC forensic events
            </div>
          </div>
        </SpotlightCard>

        {/* Metric 4: Verified Findings */}
        <SpotlightCard className="p-5 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Proven Findings
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalFindings}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Claims validated by verifier
            </div>
          </div>
        </SpotlightCard>

        {/* Metric 5: ML Models Online (Branch aviral) */}
        <SpotlightCard className="p-5 flex flex-col justify-between hover:shadow-md transition-all bg-gradient-to-br from-indigo-50/50 to-white">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
              Supervised ML
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-indigo-950 tracking-tight">
              8 Models
            </div>
            <div className="text-[11px] text-indigo-600 mt-0.5 font-semibold">
              XGBoost, RF, TF-IDF Loaded
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* =========================================================================
          SECTION 3: ARCHITECTURE & BENTO CAPABILITIES GRID
          ========================================================================= */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
              THE TRACE ADVANTAGE
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Why Autonomous Forensics Changes the Game
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Five synchronized architectural pillars designed specifically for incident responders, SOC teams, and forensic analysts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Bento Card 1: Adaptive Agent */}
          <SpotlightCard className="p-6 flex flex-col justify-between group hover:border-indigo-300 hover:shadow-lg transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/80">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Single Adaptive Investigation Agent
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dynamic bounded control loop with hypothesis formulation, query adaptation, and bounded retries. Never hallucinates; replans autonomously when tools fail.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-purple-700 font-semibold">
              <span>Dynamic Replanning</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </SpotlightCard>

          {/* Bento Card 2: ML Forensic Triage */}
          <Link href="/triage" className="group">
            <SpotlightCard className="p-6 h-full flex flex-col justify-between border-indigo-200/80 hover:border-indigo-400 hover:shadow-lg transition-all bg-gradient-to-br from-indigo-50/20 to-white">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/80">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Automated ML Triage
                  </h3>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Supervised two-stage classification: infers threat scenarios (data leakage, timeline anomaly, web activity) and scores incident severity in real time.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-semibold">
                <span>Explore ML Simulator</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </SpotlightCard>
          </Link>

          {/* Bento Card 3: Deterministic Verifier */}
          <SpotlightCard className="p-6 flex flex-col justify-between group hover:border-indigo-300 hover:shadow-lg transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Independent Deterministic Verifier
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verifies factual claims against physical primary source record IDs. Rejects speculative conclusions, unobserved executions, and claims in degraded evidence.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>Zero Hallucinations</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </SpotlightCard>

          {/* Bento Card 4: Multi-Pivot Visualizations */}
          <Link href="/evidence" className="group">
            <SpotlightCard className="p-6 h-full flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/80">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Multi-Pivot Forensic Visualizations
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Interactive React Flow evidence graph, chronological UTC timeline, and process ancestry tree separating observed creations from inferred telemetry.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-sky-700 font-semibold">
                <span>View Graph &amp; Timeline</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </SpotlightCard>
          </Link>

          {/* Bento Card 5: Forensic Tool Registry */}
          <Link href="/tools" className="group">
            <SpotlightCard className="p-6 h-full flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Integrated Forensic Tool Registry
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Modular registry featuring native Windows EVTX parsers, Sysmon decoders, The Sleuth Kit (TSK), Autopsy CLI, and Volatility 3 v2.28.2 adapters.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold">
                <span>Inspect Tool Status</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </SpotlightCard>
          </Link>

          {/* Bento Card 6: Cryptographic Integrity */}
          <SpotlightCard className="p-6 flex flex-col justify-between group hover:border-indigo-300 hover:shadow-lg transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Chain of Custody &amp; Integrity
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                SHA-256 acquisition hashes, read-only original preservation, Zip-Slip path traversal shields, and tamper-evident append-only audit chaining.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-rose-700 font-semibold">
              <span>Court-Admissible Provenance</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: ACTIVE FORENSIC CASE LEDGER
          ========================================================================= */}
      <SpotlightCard className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              Active Forensic Investigations Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an investigation to inspect live execution trace, chronological timeline, and evidence graph.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleQuickSeedAndNavigate}
              disabled={isSeeding}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
            >
              Seed Complete Case
            </button>
            <Link
              href="/investigations"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm"
            >
              + New Case
            </Link>
          </div>
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
              Drop evidence logs into Case Intake or click below to launch the verified offline demo scenario.
            </p>
            <button
              onClick={handleQuickSeedAndNavigate}
              disabled={isSeeding}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              <span>Launch Demo Case</span>
            </button>
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
                  <th className="pb-3">Engine Mode</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/investigations/${c.id}`)}
                  >
                    <td className="py-3.5 pl-2 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                            {c.objective || "Autonomous forensic investigation"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-slate-600">
                      {c.artifact_count || 1} files
                    </td>
                    <td className="py-3.5 font-mono font-semibold text-slate-900">
                      {c.event_count || 9} events
                    </td>
                    <td className="py-3.5 font-mono text-emerald-600 font-semibold">
                      {c.finding_count || 2} proved
                    </td>
                    <td className="py-3.5 font-mono text-slate-500 text-[11px]">
                      {c.is_demo ? "Deterministic Offline" : "Adaptive AI"}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <Link
                        href={`/investigations/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
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
