import React, { useState } from "react";
import { Search, Filter, Clock, Hash, Database, ChevronRight, User } from "lucide-react";
import { EvidenceEvent } from "@/lib/types";

interface TimelineViewProps {
  events: EvidenceEvent[];
  onSelectEvent: (event: EvidenceEvent) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events, onSelectEvent }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const eventTypes = ["all", ...Array.from(new Set(events.map((e) => e.event_type)))];

  const filtered = events.filter((ev) => {
    if (selectedType !== "all" && ev.event_type !== selectedType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const fields = ev.normalized_fields || {};
      const str = `${ev.event_type} ${fields.process_name || ""} ${fields.command_line || ""} ${fields.file_path || ""} ${fields.user || ""}`.toLowerCase();
      if (!str.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-cyber-bg p-6 space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-cyber-card border border-cyber-border p-3.5 rounded-lg">
        {/* Search Input */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-cyber-dim absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search processes, paths, command lines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded pl-9 pr-3 py-1.5 text-xs text-cyber-text placeholder-cyber-dim focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-cyber-dim" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-cyber-surface border border-cyber-border rounded px-2.5 py-1.5 text-xs text-cyber-text focus:outline-none font-mono cursor-pointer"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t} className="bg-cyber-card text-cyber-text">
                {t === "all" ? "All Event Types" : t}
              </option>
            ))}
          </select>
          <span className="text-xs font-mono text-cyber-dim px-2">
            {filtered.length} / {events.length} records
          </span>
        </div>
      </div>

      {/* Chronological Event Stream */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-cyber-dim bg-cyber-card border border-cyber-border rounded-lg">
            No forensic events matched the filter criteria.
          </div>
        ) : (
          filtered.map((ev) => {
            const norm = ev.normalized_fields || {};
            const timeStr = new Date(ev.timestamp_utc).toISOString().replace("T", " ").replace("Z", " UTC");

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="group p-3.5 rounded-lg border border-cyber-border bg-cyber-card hover:bg-cyber-surface hover:border-sky-600/70 transition-all cursor-pointer shadow-sm flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Timestamp & Type Box */}
                  <div className="shrink-0 text-left font-mono">
                    <span className="text-[11px] font-bold text-sky-400 block">
                      {ev.timestamp_utc.slice(11, 19)} UTC
                    </span>
                    <span className="text-[10px] text-cyber-dim block px-1.5 py-0.5 rounded bg-cyber-surface border border-cyber-border mt-1">
                      {ev.source_record_id}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyber-text px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border">
                        {ev.event_type}
                      </span>
                      {norm.process_name && (
                        <span className="font-mono text-xs text-sky-300 font-bold">
                          {norm.process_name} {norm.pid && `[${norm.pid}]`}
                        </span>
                      )}
                      {norm.user && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                          <User className="w-3 h-3" /> {norm.user}
                        </span>
                      )}
                    </div>

                    {/* Summary / Command Line */}
                    <p className="text-xs text-cyber-muted font-mono truncate leading-normal">
                      {norm.command_line || norm.file_path || norm.description || "System telemetry event logged"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-center">
                  <span className="text-[10px] font-mono text-cyber-dim group-hover:text-sky-400 transition-colors flex items-center gap-1">
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
