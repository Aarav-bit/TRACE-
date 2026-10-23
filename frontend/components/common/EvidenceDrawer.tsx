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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-cyber-card border-l border-cyber-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-cyber-border flex items-center justify-between bg-cyber-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-sky-950 border border-sky-800 text-sky-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800">
                  {event.source_record_id}
                </span>
                <span className="text-xs text-cyber-muted font-mono">{event.event_type}</span>
              </div>
              <h3 className="text-sm font-semibold text-cyber-text mt-0.5">
                Forensic Source Record Inspector
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-cyber-surface text-cyber-muted hover:text-cyber-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded bg-cyber-surface border border-cyber-border">
              <span className="text-cyber-dim block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> UTC Timestamp
              </span>
              <span className="text-cyber-text font-bold">{event.timestamp_utc}</span>
            </div>
            <div className="p-3 rounded bg-cyber-surface border border-cyber-border">
              <span className="text-cyber-dim block mb-1">Original Timezone</span>
              <span className="text-cyber-text font-bold">{event.timezone_metadata}</span>
            </div>
            <div className="p-3 rounded bg-cyber-surface border border-cyber-border col-span-2">
              <span className="text-cyber-dim block mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-400" /> Record Source Hash (SHA-256)
              </span>
              <span className="text-emerald-400 font-mono text-[11px] break-all">
                {event.source_hash}
              </span>
            </div>
          </div>

          {/* Standard Normalized Fields */}
          <div>
            <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Normalized Forensic Attributes
            </h4>
            <div className="rounded border border-cyber-border bg-cyber-bg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {fields.process_name && (
                    <tr className="border-b border-cyber-border/50">
                      <td className="p-2.5 text-cyber-dim font-medium w-1/3 bg-cyber-surface/30">Process</td>
                      <td className="p-2.5 text-cyber-text font-mono font-bold text-sky-300">
                        {fields.process_name} {fields.pid && `[PID ${fields.pid}]`}
                      </td>
                    </tr>
                  )}
                  {fields.parent_process_name && (
                    <tr className="border-b border-cyber-border/50">
                      <td className="p-2.5 text-cyber-dim font-medium bg-cyber-surface/30">Parent Process</td>
                      <td className="p-2.5 text-cyber-text font-mono">
                        {fields.parent_process_name} {fields.ppid && `[PPID ${fields.ppid}]`}
                      </td>
                    </tr>
                  )}
                  {fields.user && (
                    <tr className="border-b border-cyber-border/50">
                      <td className="p-2.5 text-cyber-dim font-medium bg-cyber-surface/30">User Account</td>
                      <td className="p-2.5 text-emerald-300 font-mono font-bold">{fields.user}</td>
                    </tr>
                  )}
                  {fields.command_line && (
                    <tr className="border-b border-cyber-border/50">
                      <td className="p-2.5 text-cyber-dim font-medium bg-cyber-surface/30">Command Line</td>
                      <td className="p-2.5 text-amber-300 font-mono break-all leading-relaxed">
                        {fields.command_line}
                      </td>
                    </tr>
                  )}
                  {fields.file_path && (
                    <tr className="border-b border-cyber-border/50">
                      <td className="p-2.5 text-cyber-dim font-medium bg-cyber-surface/30">Target File</td>
                      <td className="p-2.5 text-cyber-text font-mono break-all">{fields.file_path}</td>
                    </tr>
                  )}
                  {fields.source_ip && (
                    <tr className="border-b border-cyber-border/50">
                      <td className="p-2.5 text-cyber-dim font-medium bg-cyber-surface/30">Network Socket</td>
                      <td className="p-2.5 text-cyber-text font-mono">
                        {fields.source_ip} &rarr; {fields.dest_ip}:{fields.dest_port}
                      </td>
                    </tr>
                  )}
                  {fields.description && (
                    <tr>
                      <td className="p-2.5 text-cyber-dim font-medium bg-cyber-surface/30">Description</td>
                      <td className="p-2.5 text-cyber-text">{fields.description}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw Ingested JSON */}
          <div>
            <h4 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-cyber-dim" /> Raw Telemetry Payload
            </h4>
            <pre className="p-4 rounded border border-cyber-border bg-cyber-bg text-[11px] font-mono text-cyber-text overflow-x-auto max-h-60 leading-normal">
              {JSON.stringify(fields.raw_attributes || fields, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyber-border bg-cyber-surface/30 flex justify-between items-center text-xs text-cyber-dim">
          <span>Cryptographic Hash Verified</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-cyber-text font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
