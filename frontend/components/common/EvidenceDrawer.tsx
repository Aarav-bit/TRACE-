"use client";

import React from "react";
import { X, ShieldCheck, Clock, Hash, FileCode, Database } from "lucide-react";
import { EvidenceEvent } from "@/lib/types";

interface EvidenceDrawerProps {
  event: EvidenceEvent | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ event, onClose }) => {
  if (!event) return null;

  const fields = event.normalized_fields || {};

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-700">
              <Database className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {event.source_record_id}
                </span>
                <span className="text-xs text-slate-500 font-mono">{event.event_type}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Forensic Source Record Inspector
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-1 flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> UTC Timestamp
              </span>
              <span className="text-slate-900 font-bold">{event.timestamp_utc}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-1 font-bold">Original Timezone</span>
              <span className="text-slate-900 font-bold">{event.timezone_metadata}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 col-span-2">
              <span className="text-slate-400 block mb-1 flex items-center gap-1.5 font-bold">
                <Hash className="w-3.5 h-3.5 text-emerald-600" /> Record Source Hash (SHA-256)
              </span>
              <span className="text-slate-700 text-[11px] break-all">{event.source_hash || event.id}</span>
            </div>
          </div>

          {/* Normalized Telemetry Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Normalized Forensic Fields</span>
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs font-mono">
              {Object.entries(fields).map(([key, val]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0 gap-1">
                  <span className="text-slate-400 font-semibold">{key}:</span>
                  <span className="text-slate-900 font-bold break-all sm:text-right">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Ingest Payload */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-slate-500" />
              <span>Raw JSON Ingest Payload</span>
            </h4>
            <pre className="p-4 rounded-2xl bg-[#111317] text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed max-h-60">
              {JSON.stringify(fields.raw_attributes || fields, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDrawer;
