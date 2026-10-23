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
  Download,
  Info,
} from "lucide-react";
import {
  createCase,
  uploadArtifacts,
  startInvestigation,
} from "@/lib/api";
import { Artifact, Case } from "@/lib/types";

export default function CreateInvestigationPage() {
  const router = useRouter();

  // Form state
  const [caseName, setCaseName] = useState("");
  const [objective, setObjective] = useState(
    "Investigate whether suspicious PowerShell execution led to unauthorized file activity. Reconstruct the event sequence, identify the processes and accounts involved, correlate available artifacts, and report which conclusions are supported by the evidence."
  );
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"deterministic" | "ai">("deterministic");
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

  const handleCreateCaseAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim() || !objective.trim()) {
      setErrorMsg("Case name and investigation objective are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Step 1: Create Case in DB
      const newCase = await createCase({
        name: caseName,
        objective: objective,
        description: description,
        is_demo: false,
      });

      // Step 2: Upload and Hash Artifacts
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
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-cyber-border pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
              Evidence Ingested & Hashed
            </span>
            <h1 className="text-xl font-bold text-cyber-text mt-1">
              {createdCase.name}
            </h1>
            <p className="text-xs text-cyber-muted font-mono">
              Case UUID: {createdCase.id} &bull; Mode: {mode.toUpperCase()}
            </p>
          </div>

          <button
            onClick={handleStartInvestigation}
            disabled={isStartingInv}
            className="px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>{isStartingInv ? "Starting Investigation..." : "Launch Autonomous Investigation"}</span>
          </button>
        </div>

        {/* Evidence Manifest Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cyber-text">
              Ingested Forensic Manifest ({artifactsManifest.length} source file{artifactsManifest.length === 1 ? "" : "s"})
            </h2>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Cryptographic SHA-256 Validated &amp; Preserved Read-Only
            </span>
          </div>

          {artifactsManifest.length === 0 ? (
            <div className="p-8 rounded-lg bg-cyber-card border border-cyber-border text-center text-xs text-cyber-dim">
              No physical artifact files attached. Investigation will query baseline telemetry.
            </div>
          ) : (
            <div className="rounded-lg border border-cyber-border bg-cyber-card overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-surface/60 font-mono text-[11px] text-cyber-dim uppercase">
                    <th className="p-3 pl-4">Filename</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">SHA-256 Digest</th>
                    <th className="p-3">Parser Engine</th>
                    <th className="p-3">Records</th>
                    <th className="p-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/60 font-mono">
                  {artifactsManifest.map((art) => (
                    <tr key={art.id} className="hover:bg-cyber-surface/30">
                      <td className="p-3 pl-4 font-bold text-cyber-text">
                        {art.original_filename}
                      </td>
                      <td className="p-3 text-cyber-dim uppercase">{art.artifact_type}</td>
                      <td className="p-3 text-cyber-dim">{art.file_size.toLocaleString()} B</td>
                      <td className="p-3 text-emerald-400 text-[11px] font-mono">
                        {art.sha256.slice(0, 16)}...{art.sha256.slice(-8)}
                      </td>
                      <td className="p-3 text-cyber-muted">{art.parser_name}</td>
                      <td className="p-3 text-sky-400 font-bold">{art.record_count}</td>
                      <td className="p-3 pr-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase font-bold">
                          {art.parser_status}
                        </span>
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

  // SCREEN B: Case Intake & File Upload Form
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-cyber-border pb-4">
        <h1 className="text-xl font-bold text-cyber-text">
          Forensic Case Intake &amp; Evidence Ingestion
        </h1>
        <p className="text-xs text-cyber-muted font-mono mt-0.5">
          Establish case parameters, ingest raw endpoint artifacts, and compute cryptographic chain-of-custody hashes
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCreateCaseAndUpload} className="space-y-5">
        {/* Case Name */}
        <div>
          <label className="block text-xs font-medium text-cyber-muted mb-1">
            Case Title &amp; Incident Identifier
          </label>
          <input
            type="text"
            required
            placeholder="e.g. INC-2026-9402: Suspicious Administrative Execution & Payload Staging"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            className="w-full bg-cyber-card border border-cyber-border rounded-lg px-3.5 py-2 text-xs text-cyber-text focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Objective */}
        <div>
          <label className="block text-xs font-medium text-cyber-muted mb-1">
            Investigation Objective &amp; Scope
          </label>
          <textarea
            required
            rows={2}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full bg-cyber-card border border-cyber-border rounded-lg p-3 text-xs text-cyber-text focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
          />
        </div>

        {/* Investigation Mode */}
        <div>
          <label className="block text-xs font-medium text-cyber-muted mb-1.5">
            Reasoning Engine
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setMode("ai")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                mode === "ai"
                  ? "bg-cyber-surface border-sky-500 text-cyber-text"
                  : "bg-cyber-card border-cyber-border text-cyber-muted hover:border-cyber-borderLight"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-cyber-text">
                  Adaptive AI (NVIDIA Nemotron 120B)
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                  NVIDIA NIM
                </span>
              </div>
              <p className="text-[11px] text-cyber-dim leading-normal">
                Dispatches structured tool calls to <code className="text-emerald-400">nvidia/nemotron-3.5-super-vl-120b-a12b</code>. Falls back to local engine if offline.
              </p>
            </div>

            <div
              onClick={() => setMode("deterministic")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                mode === "deterministic"
                  ? "bg-cyber-surface border-sky-500 text-cyber-text"
                  : "bg-cyber-card border-cyber-border text-cyber-muted hover:border-cyber-borderLight"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-cyber-text">
                  Autonomous Local Engine
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950/60 text-sky-400 border border-sky-800/60">
                  OFFLINE
                </span>
              </div>
              <p className="text-[11px] text-cyber-dim leading-normal">
                Private and offline. Rule-based threat heuristics, parent-child process tree reconstruction, and independent verifier.
              </p>
            </div>
          </div>
        </div>

        {/* Evidence Upload Zone */}
        <div>
          <label className="block text-xs font-semibold text-cyber-text uppercase tracking-wider mb-1.5">
            Forensic Evidence Upload (Drag &amp; Drop)
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-cyber-border hover:border-sky-500/80 rounded-xl p-8 bg-cyber-card/60 text-center transition-colors cursor-pointer"
          >
            <input
              type="file"
              multiple
              id="file-upload"
              onChange={handleFileInput}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <span className="text-xs font-semibold text-cyber-text block">
                Drag and drop forensic log files or archives here, or browse
              </span>
              <span className="text-[11px] text-cyber-dim font-mono block mt-1">
                Supports Windows EVTX (.evtx), Sysmon/Security JSON/JSONL, Command CSV, and ZIP triage bundles (Up to 50MB)
              </span>
            </label>
          </div>

          {/* Attached Files List */}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              <span className="text-xs font-mono text-cyber-dim">
                Attached Artifacts ({files.length}):
              </span>
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded bg-cyber-card border border-cyber-border text-xs font-mono"
                >
                  <div className="flex items-center gap-2 text-cyber-text">
                    <FileCode className="w-4 h-4 text-sky-400" />
                    <span className="font-bold">{file.name}</span>
                    <span className="text-cyber-dim text-[11px]">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-cyber-dim hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-4 border-t border-cyber-border">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? "Ingesting & Hashing Evidence..." : "Ingest Evidence & Validate Manifest"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
