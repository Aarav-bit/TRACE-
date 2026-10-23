"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertCircle, HelpCircle, ExternalLink, ArrowRight, CheckCircle2 } from "lucide-react";
import { Finding } from "@/lib/types";

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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "supported":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supported</span>
          </span>
        );
      case "contradicted":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Contradicted</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Unresolved</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-4 overflow-y-auto">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Independent Deterministic Findings
          </h2>
          <p className="text-xs text-slate-500">
            Every claim is validated by the verifier against primary evidence record UUIDs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", "supported", "unresolved", "contradicted"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                filter === status
                  ? "bg-[#111317] text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
          No findings match the selected status filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((f, idx) => (
            <div
              key={f.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block mb-1">
                    Finding #{idx + 1} &bull; ID: {f.id.slice(0, 8)}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {f.title}
                  </h3>
                </div>
                {getStatusBadge(f.status)}
              </div>

              {/* Claim Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed font-mono">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Investigative Claim
                </span>
                {f.claim}
              </div>

              {/* Uncertainty Notes */}
              {f.uncertainty_notes && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-1 flex items-center gap-1 text-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Uncertainty &amp; Evidentiary Gaps
                  </span>
                  {f.uncertainty_notes}
                </div>
              )}

              {/* Substantiating Evidence Records */}
              {f.evidence_links && f.evidence_links.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 block mb-2 uppercase">
                    Cited Evidence Provenance ({f.evidence_links.length} source records)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {f.evidence_links.map((link, lIdx) => (
                      <div
                        key={lIdx}
                        onClick={() => onSelectEvidenceId && onSelectEvidenceId(link.evidence_event_id)}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-xs font-mono cursor-pointer group transition-all"
                      >
                        <div>
                          <span className="text-slate-900 font-bold block">
                            Record #{link.source_record_id || link.evidence_event_id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {link.explanation || link.relationship_type}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                <span>Verification Engine: {f.verification_method}</span>
                <span>Confidence: <strong className="text-slate-800">{f.confidence_assessment}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindingsBrowser;
