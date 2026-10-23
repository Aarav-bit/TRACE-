import React, { useState } from "react";
import { ShieldCheck, AlertCircle, HelpCircle, ExternalLink, ArrowRight } from "lucide-react";
import { Finding } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";

interface FindingsBrowserProps {
  findings: Finding[];
  onSelectEvidenceId?: (id: string) => void;
}

export const FindingsBrowser: React.FC<FindingsBrowserProps> = ({ findings, onSelectEvidenceId }) => {
  const [filter, setFilter] = useState<string>("all");

  const filtered = findings.filter((f) => {
    if (filter === "all") return true;
    return f.status === filter;
  });

  return (
    <div className="flex flex-col h-full bg-cyber-bg p-6 space-y-4 overflow-y-auto">
      {/* Header & Filter Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
        <div>
          <h2 className="text-sm font-bold text-cyber-text">
            Independent Deterministic Findings
          </h2>
          <p className="text-xs text-cyber-dim font-mono">
            Evaluated by the verification subsystem decoupled from LLM confidence
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-cyber-surface p-1 rounded-md border border-cyber-border text-xs font-mono">
          {["all", "supported", "unresolved", "contradicted"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded capitalize transition-colors ${
                filter === status
                  ? "bg-sky-500 text-black font-bold"
                  : "text-cyber-muted hover:text-cyber-text"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-cyber-dim bg-cyber-card border border-cyber-border rounded-lg">
          No findings match the selected status filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((f, idx) => (
            <div
              key={f.id}
              className="p-5 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-borderLight transition-all shadow-md space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-cyber-dim uppercase block mb-1">
                    Finding #{idx + 1} &bull; ID: {f.id.slice(0, 8)}
                  </span>
                  <h3 className="text-sm font-bold text-cyber-text leading-snug">
                    {f.title}
                  </h3>
                </div>
                <StatusBadge status={f.status} />
              </div>

              {/* Claim Box */}
              <div className="p-3.5 rounded bg-cyber-surface/80 border border-cyber-border text-xs text-cyber-text leading-relaxed font-mono">
                <span className="text-[10px] uppercase font-bold text-cyber-dim block mb-1">
                  Investigative Claim
                </span>
                {f.claim}
              </div>

              {/* Uncertainty Notes */}
              {f.uncertainty_notes && (
                <div className="p-3 rounded bg-amber-950/20 border border-amber-800/50 text-xs text-amber-300">
                  <span className="font-bold block mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Uncertainty & Evidentiary Gaps
                  </span>
                  {f.uncertainty_notes}
                </div>
              )}

              {/* Substantiating Evidence Records */}
              {f.evidence_links && f.evidence_links.length > 0 && (
                <div className="pt-2 border-t border-cyber-border/40">
                  <span className="text-[10px] font-mono text-cyber-dim block mb-2 uppercase">
                    Cited Evidence Provenance ({f.evidence_links.length} source records)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {f.evidence_links.map((link, lIdx) => (
                      <div
                        key={lIdx}
                        onClick={() => onSelectEvidenceId && onSelectEvidenceId(link.evidence_event_id)}
                        className="p-2.5 rounded bg-cyber-bg hover:bg-cyber-surface border border-cyber-border flex items-center justify-between text-xs font-mono cursor-pointer group transition-colors"
                      >
                        <div>
                          <span className="text-sky-300 font-bold block">
                            Record #{link.source_record_id || link.evidence_event_id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-cyber-dim">
                            {link.explanation || link.relationship_type}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-cyber-dim group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-[11px] font-mono text-cyber-dim pt-2 border-t border-cyber-border/30">
                <span>Verification Engine: {f.verification_method}</span>
                <span>Confidence: <strong className="text-cyber-text">{f.confidence_assessment}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
