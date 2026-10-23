"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileCheck,
  Play,
  AlertCircle,
  FileCode,
  HardDrive,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Cpu,
  Layers,
  FileText,
} from "lucide-react";
import {
  createCase,
  uploadArtifacts,
  startInvestigation,
} from "@/lib/api";
import { Artifact, Case } from "@/lib/types";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { DecryptedText } from "@/components/reactbits/DecryptedText";

export default function CreateInvestigationPage() {
  const router = useRouter();

  // Form state
  const [caseName, setCaseName] = useState("");
  const [objective, setObjective] = useState(
    "Investigate whether suspicious PowerShell execution led to unauthorized file activity. Reconstruct the event sequence, identify the processes and accounts involved, correlate available artifacts, and report which conclusions are supported by the evidence."
  );
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"deterministic" | "ai">("ai");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manifest stage state (Screen C)
  const [createdCase, setCreatedCase] = useState<Case | null>(null);
  const [artifactsManifest, setArtifactsManifest] = useState<Artifact[]>([]);
  const [isStartingInv, setIsStartingInv] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const prefillSampleScenario = () => {
    setCaseName("IR-2026-ALPHA");
    setDescription("Workstation WS-SEC-OPS01 reported anomalous base64 encoded command string execution.");
    setObjective(
      "Investigate whether suspicious PowerShell execution led to unauthorized file activity. Reconstruct the event sequence, identify the processes and accounts involved, correlate available artifacts, and report which conclusions are supported by the evidence."
    );
  };

  const handleCreateCaseAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim() || !objective.trim()) {
      setErrorMsg("Case name and investigation objective are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newCase = await createCase({
        name: caseName,
        objective: objective,
        description: description,
        is_demo: false,
      });

      let uploaded: Artifact[] = [];
      if (files.length > 0) {
        uploaded = await uploadArtifacts(newCase.id, files);
      }

      setCreatedCase(newCase);
      setArtifactsManifest(uploaded);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create case or parse evidence files.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartInvestigation = async () => {
    if (!createdCase) return;
    setIsStartingInv(true);
    try {
      const inv = await startInvestigation(createdCase.id, {
        objective: createdCase.objective,
        mode: mode,
      });
      router.push(`/investigations/${inv.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to launch autonomous investigation agent.");
      setIsStartingInv(false);
    }
  };

  // SCREEN C: Evidence Manifest & Chain of Custody Validation
  if (createdCase) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
        <SpotlightCard className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Evidence Ingested &amp; Hashed
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
                {createdCase.name}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                UUID: {createdCase.id} &bull; Engine: {mode === "ai" ? "NVIDIA Nemotron 3.5 Super VL 120B" : "Deterministic Local DFIR Engine"}
              </p>
            </div>

            <button
              onClick={handleStartInvestigation}
              disabled={isStartingInv}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-lime-400 text-lime-400" />
              <span>{isStartingInv ? "Starting Investigation..." : "Launch Autonomous Investigation"}</span>
            </button>
          </div>

          {/* Evidence Manifest Table */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Cryptographic Artifact Manifest ({artifactsManifest.length} file{artifactsManifest.length === 1 ? "" : "s"})
              </h2>
              <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> SHA-256 Validated &amp; Preserved Read-Only
              </span>
            </div>

            {artifactsManifest.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No physical files attached. Investigation will query baseline database telemetry.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="p-3.5 pl-4">Source Filename</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Size</th>
                      <th className="p-3.5">SHA-256 Cryptographic Hash</th>
                      <th className="p-3.5 text-right pr-4">Events</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {artifactsManifest.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 pl-4 font-semibold text-slate-900 flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-sky-500 shrink-0" />
                          <span>{art.original_filename}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {art.artifact_type}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono">
                          {((art.file_size || 0) / 1024).toFixed(1)} KB
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                          <DecryptedText text={art.sha256 ? art.sha256.substring(0, 24) + "..." : "N/A"} speed={25} />
                        </td>
                        <td className="p-3.5 text-right pr-4 font-mono font-bold text-slate-900">
                          {art.record_count || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SpotlightCard>
      </div>
    );
  }

  // SCREEN B: Case Intake Form
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Case Intake &amp; Ingestion
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Initialize a forensic case, select reasoning engine, and ingest raw evidence files.
          </p>
        </div>

        <button
          type="button"
          onClick={prefillSampleScenario}
          className="self-start sm:self-auto px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Fill Scenario</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCreateCaseAndUpload} className="space-y-6">
        {/* Card 1: Case Details */}
        <SpotlightCard className="p-6 sm:p-8 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Investigation Objective
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Case Identifier / Target Name *
              </label>
              <input
                type="text"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                placeholder="e.g. IR-2026-ALPHA or Workstation-Compromise-01"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Investigative Hypothesis &amp; Scope *
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </SpotlightCard>

        {/* Card 2: Engine Selector (Bento Choice Tiles) */}
        <SpotlightCard className="p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Autonomous Reasoning Engine
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option A: Adaptive AI Mode */}
            <div
              onClick={() => setMode("ai")}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                mode === "ai"
                  ? "border-lime-500 bg-lime-50/40 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-lime-100 text-lime-800">
                    <Sparkles className="w-4 h-4 text-lime-700" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-200 text-lime-900">
                    Recommended
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Adaptive AI Mode
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Powered by <strong>NVIDIA Nemotron 3.5 Super VL 120B</strong> via NVIDIA NIM API. Multi-step reasoning with autonomous tool execution.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>nvidia/nemotron-3.5-super-vl-120b</span>
                {mode === "ai" && <CheckCircle2 className="w-4 h-4 text-lime-600" />}
              </div>
            </div>

            {/* Option B: Local Deterministic Engine */}
            <div
              onClick={() => setMode("deterministic")}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                mode === "deterministic"
                  ? "border-sky-500 bg-sky-50/40 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-sky-100 text-sky-800">
                    <Cpu className="w-4 h-4 text-sky-700" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                    Air-Gapped
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Local Deterministic Engine
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  100% offline rule-based DFIR heuristics. LOLBin regex correlation, parent-child tree reconstruction, zero API keys required.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Deterministic Heuristic</span>
                {mode === "deterministic" && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Card 3: Artifact Upload Dropzone */}
        <SpotlightCard className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Evidence File Staging
            </h2>
            <span className="text-xs text-slate-400">
              Drag &amp; drop from Desktop
            </span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-200 hover:border-lime-500 rounded-3xl p-8 text-center transition-all bg-slate-50/50 hover:bg-lime-50/10 cursor-pointer"
          >
            <input
              type="file"
              multiple
              id="evidence-file-input"
              className="hidden"
              onChange={handleFileInput}
              accept=".json,.csv,.evtx,.zip"
            />
            <label
              htmlFor="evidence-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600">
                <Upload className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Click to browse or drag &amp; drop evidence files here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">incident_triage_evidence.json</code>, CSV, EVTX, and ZIP bundles
                </p>
              </div>
            </label>
          </div>

          {/* Staged Files List */}
          {files.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-slate-700">
                Staged Evidence Files ({files.length}):
              </div>
              <div className="space-y-1.5">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({(f.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SpotlightCard>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? "Ingesting & Hashing..." : "Create Case & Hash Manifest"}</span>
            <ArrowRight className="w-4 h-4 text-lime-400" />
          </button>
        </div>
      </form>
    </div>
  );
}
