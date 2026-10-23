import React, { useState } from "react";
import {
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  Users,
  Cpu,
  FileCode,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Finding } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";

interface FindingsSummaryProps {
  findings: Finding[];
  onSelectFinding?: (finding: Finding) => void;
  onSelectEvidenceId?: (id: string) => void;
}

export const FindingsSummary: React.FC<FindingsSummaryProps> = ({
  findings,
  onSelectFinding,
  onSelectEvidenceId,
}) => {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const supported = findings.filter((f) => f.status === "supported");
  const unresolved = findings.filter((f) => f.status === "unresolved");
  const contradicted = findings.filter((f) => f.status === "contradicted");

  const handleCardClick = (f: Finding) => {
    setSelectedFinding(f);
    if (onSelectFinding) onSelectFinding(f);
  };

  return (
    <div className="flex flex-col h-full bg-cyber-card border-l border-cyber-border overflow-y-auto p-5 space-y-6">
      {/* Title & Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-cyber-text tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Independent Verification</span>
          </h2>
          <span className="text-xs font-mono text-cyber-dim">
            {findings.length} evaluated
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/60">
            <span className="text-emerald-400 font-bold block text-base">{supported.length}</span>
            <span className="text-[10px] text-cyber-dim uppercase">Supported</span>
          </div>
          <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60">
            <span className="text-amber-400 font-bold block text-base">{unresolved.length}</span>
            <span className="text-[10px] text-cyber-dim uppercase">Unresolved</span>
          </div>
          <div className="p-2 rounded bg-rose-950/40 border border-rose-800/60">
            <span className="text-rose-400 font-bold block text-base">{contradicted.length}</span>
            <span className="text-[10px] text-cyber-dim uppercase">Contradicted</span>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div>
        <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2">
          Substantiated & Unresolved Claims
        </h3>
        {findings.length === 0 ? (
          <div className="p-6 rounded border border-cyber-border bg-cyber-surface/40 text-center text-xs text-cyber-dim">
            Agent is currently accumulating evidence. Findings will be posted as verification checks execute.
          </div>
        ) : (
          <div className="space-y-2.5">
            {findings.map((f) => (
              <div
                key={f.id}
                onClick={() => handleCardClick(f)}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  selectedFinding?.id === f.id
                    ? "bg-cyber-surface border-sky-500 shadow-sm"
                    : "bg-cyber-bg hover:bg-cyber-surface/80 border-cyber-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-bold text-cyber-text leading-snug">
                    {f.title}
                  </h4>
                  <StatusBadge status={f.status} size="sm" />
                </div>
                <p className="text-[11px] text-cyber-muted line-clamp-2 leading-relaxed mb-2">
                  {f.claim}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-cyber-dim pt-2 border-t border-cyber-border/40">
                  <span>Method: {f.verification_method.slice(0, 16)}...</span>
                  <span className="text-sky-400 flex items-center gap-0.5">
                    Inspect &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Finding Detail Modal / Panel */}
      {selectedFinding && (
        <div className="p-4 rounded border border-sky-800/80 bg-sky-950/20 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">
              Finding Verification Proof
            </span>
            <button
              onClick={() => setSelectedFinding(null)}
              className="text-cyber-dim hover:text-cyber-text text-xs"
            >
              &times; Close
            </button>
          </div>
          <div className="font-semibold text-cyber-text">{selectedFinding.title}</div>
          <p className="text-cyber-muted leading-relaxed text-[11px]">
            {selectedFinding.claim}
          </p>

          {/* Uncertainty notes if present */}
          {selectedFinding.uncertainty_notes && (
            <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/50 text-amber-300 text-[11px]">
              <span className="font-bold block mb-0.5">Evidentiary Uncertainty:</span>
              {selectedFinding.uncertainty_notes}
            </div>
          )}

          {/* Evidence links */}
          {selectedFinding.evidence_links?.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-cyber-dim block mb-1">
                Substantiating Source Records:
              </span>
              <div className="space-y-1">
                {selectedFinding.evidence_links.map((link, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectEvidenceId && onSelectEvidenceId(link.evidence_event_id)}
                    className="p-1.5 rounded bg-cyber-surface hover:bg-sky-950 border border-cyber-border flex items-center justify-between text-[11px] font-mono text-sky-300 cursor-pointer"
                  >
                    <span>Record #{link.source_record_id || link.evidence_event_id.slice(0, 8)}</span>
                    <ExternalLink className="w-3 h-3 text-sky-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Entities Detected */}
      <div>
        <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2">
          Observed Entities
        </h3>
        <div className="space-y-2 text-xs font-mono">
          <div className="p-2 rounded bg-cyber-surface border border-cyber-border flex items-center justify-between">
            <span className="text-cyber-dim flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> User
            </span>
            <span className="text-cyber-text font-bold">SYSTEM_ADMIN</span>
          </div>
          <div className="p-2 rounded bg-cyber-surface border border-cyber-border flex items-center justify-between">
            <span className="text-cyber-dim flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> Suspicious Shell
            </span>
            <span className="text-sky-300 font-bold">powershell.exe [5912]</span>
          </div>
          <div className="p-2 rounded bg-cyber-surface border border-cyber-border flex items-center justify-between">
            <span className="text-cyber-dim flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-amber-400" /> Dropped Target
            </span>
            <span className="text-amber-300 font-bold">scvhost.exe [6204]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
