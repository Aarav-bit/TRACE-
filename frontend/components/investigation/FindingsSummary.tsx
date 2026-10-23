"use client";

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
    <div className="flex flex-col h-full bg-white border-l border-slate-200/80 overflow-y-auto p-5 space-y-5">
      {/* Title & Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Independent Verification</span>
          </h2>
          <span className="text-xs font-mono text-slate-400 font-semibold">
            {findings.length} evaluated
          </span>
        </div>

        {/* 3 mini stat tiles */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-800 font-bold block text-base">{supported.length}</span>
            <span className="text-[10px] text-emerald-700 uppercase font-semibold">Supported</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-amber-800 font-bold block text-base">{unresolved.length}</span>
            <span className="text-[10px] text-amber-700 uppercase font-semibold">Unresolved</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
            <span className="text-rose-800 font-bold block text-base">{contradicted.length}</span>
            <span className="text-[10px] text-rose-700 uppercase font-semibold">Disproven</span>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
          Verified Finding Records
        </h4>

        {findings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl">
            Awaiting claim verification from reasoning engine...
          </div>
        ) : (
          findings.map((f) => {
            const isSupported = f.status === "supported";
            const isContradicted = f.status === "contradicted";

            return (
              <div
                key={f.id}
                onClick={() => handleCardClick(f)}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {f.title}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                      isSupported
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : isContradicted
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {f.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                  {f.claim}
                </p>

                {f.evidence_links && f.evidence_links.length > 0 && (
                  <div className="text-[10px] font-mono text-slate-400 pt-1 flex items-center gap-1">
                    <span>{f.evidence_links.length} cited evidence record{f.evidence_links.length === 1 ? "" : "s"}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FindingsSummary;
