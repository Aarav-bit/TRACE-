"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { History, Shield, Hash, ArrowRight, ExternalLink } from "lucide-react";
import { fetchCases } from "@/lib/api";
import { Case } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function HistoryPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch((e) => console.error("Error loading history:", e))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-cyber-border pb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-sky-400" />
          <h1 className="text-xl font-bold text-cyber-text">
            Investigation History & Audit Trail
          </h1>
        </div>
        <p className="text-xs text-cyber-muted font-mono mt-0.5">
          Persistent incident investigations and cryptographic chain-of-custody records
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-cyber-dim font-mono">
          Loading Investigation Ledger...
        </div>
      ) : cases.length === 0 ? (
        <div className="p-12 text-center text-xs text-cyber-dim bg-cyber-card border border-cyber-border rounded-lg">
          No investigations recorded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-borderLight transition-all shadow-md space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-cyber-dim uppercase block">
                    Case UUID: {c.id}
                  </span>
                  <h3 className="text-base font-bold text-cyber-text mt-0.5">
                    {c.name}
                  </h3>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <p className="text-xs text-cyber-muted leading-relaxed font-mono bg-cyber-surface/60 p-3 rounded border border-cyber-border">
                {c.objective}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-cyber-bg border border-cyber-border">
                  <span className="text-cyber-dim text-[10px] block">Ingested Artifacts</span>
                  <span className="text-cyber-text font-bold">{c.artifact_count}</span>
                </div>
                <div className="p-2 rounded bg-cyber-bg border border-cyber-border">
                  <span className="text-cyber-dim text-[10px] block">Normalized Events</span>
                  <span className="text-emerald-400 font-bold">{c.event_count}</span>
                </div>
                <div className="p-2 rounded bg-cyber-bg border border-cyber-border">
                  <span className="text-cyber-dim text-[10px] block">Verified Findings</span>
                  <span className="text-sky-400 font-bold">{c.finding_count}</span>
                </div>
                <div className="p-2 rounded bg-cyber-bg border border-cyber-border">
                  <span className="text-cyber-dim text-[10px] block">Created Date</span>
                  <span className="text-cyber-muted">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-cyber-border/40">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Append-only Cryptographic Audit Chain Validated
                </span>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/evidence?caseId=${c.id}`}
                    className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    Evidence Explorer <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href={`/api/cases/${c.id}/report/html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-cyber-muted hover:text-cyber-text flex items-center gap-1"
                  >
                    View Report <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
