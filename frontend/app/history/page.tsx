"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { History, Shield, Hash, ArrowRight, ExternalLink, HardDrive } from "lucide-react";
import { fetchCases } from "@/lib/api";
import { Case } from "@/lib/types";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Investigation Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-lime-100 text-lime-800 border border-lime-200">
              Audit Trail
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Persistent incident investigations and cryptographic chain-of-custody records.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-mono animate-pulse">
          Loading Investigation Ledger...
        </div>
      ) : cases.length === 0 ? (
        <SpotlightCard className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50">
          <HardDrive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Past Investigations</h3>
          <p className="text-xs text-slate-500 mt-1">
            New cases created in Case Intake will automatically appear here.
          </p>
        </SpotlightCard>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <SpotlightCard
              key={c.id}
              className="p-6 hover:border-slate-300 transition-all shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block mb-1">
                    UUID: {c.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {c.name}
                  </h3>
                  {c.objective && (
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {c.objective}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {c.status || "Active"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Artifact Files</span>
                  <span className="text-slate-800 text-sm font-bold">{c.artifact_count || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Indexed Events</span>
                  <span className="text-slate-800 text-sm font-bold">{c.event_count || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Verified Claims</span>
                  <span className="text-slate-800 text-sm font-bold">{c.finding_count || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Created Date</span>
                  <span className="text-slate-800 text-sm font-bold">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Today"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href={`/evidence?case=${c.id}`}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Explore Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
}
