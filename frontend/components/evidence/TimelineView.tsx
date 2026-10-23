"use client";

import React, { useState } from "react";
import {
  Search,
  Clock,
  ChevronRight,
  User,
  Terminal,
  Network,
  HardDrive,
  Key,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { EvidenceEvent } from "@/lib/types";

interface TimelineViewProps {
  events: EvidenceEvent[];
  onSelectEvent: (event: EvidenceEvent) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events, onSelectEvent }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Telemetry", count: events.length },
    {
      id: "process",
      label: "Process Creation",
      count: events.filter((e) => e.event_type.includes("process")).length,
    },
    {
      id: "network",
      label: "Network Sockets",
      count: events.filter((e) => e.event_type.includes("network") || e.event_type.includes("socket")).length,
    },
    {
      id: "file",
      label: "File Drops",
      count: events.filter((e) => e.event_type.includes("file")).length,
    },
    {
      id: "logon",
      label: "User Logons",
      count: events.filter((e) => e.event_type.includes("logon")).length,
    },
  ];

  const filtered = events.filter((ev) => {
    if (selectedCategory !== "all") {
      if (!ev.event_type.toLowerCase().includes(selectedCategory)) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const fields = ev.normalized_fields || {};
      const str = `${ev.event_type} ${fields.process_name || ""} ${fields.command_line || ""} ${fields.file_path || ""} ${fields.user || ""}`.toLowerCase();
      if (!str.includes(term)) return false;
    }
    return true;
  });

  const getEventBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("process")) {
      return {
        icon: Terminal,
        label: "Process Execution",
        style: "bg-sky-950/60 text-sky-300 border-sky-800/60",
      };
    }
    if (t.includes("network") || t.includes("socket")) {
      return {
        icon: Network,
        label: "Network Connection",
        style: "bg-purple-950/60 text-purple-300 border-purple-800/60",
      };
    }
    if (t.includes("file")) {
      return {
        icon: HardDrive,
        label: "File Activity",
        style: "bg-amber-950/60 text-amber-300 border-amber-800/60",
      };
    }
    if (t.includes("logon")) {
      return {
        icon: User,
        label: "Account Logon",
        style: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
      };
    }
    return {
      icon: Clock,
      label: type,
      style: "bg-cyber-surface text-cyber-text border-cyber-border",
    };
  };

  return (
    <div className="flex flex-col h-full bg-cyber-bg p-6 space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-cyber-card border border-cyber-border p-3 rounded-lg">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cyber-dim absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search processes, command lines, users, destination IPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded pl-9 pr-3 py-1.5 text-xs text-cyber-text placeholder-cyber-dim focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Quick Filter Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-sky-500 text-black font-semibold"
                  : "bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-cyber-muted"
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-75">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Event Stream */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-cyber-dim bg-cyber-card border border-cyber-border rounded-lg">
            No forensic events matched your filter criteria.
          </div>
        ) : (
          filtered.map((ev, idx) => {
            const norm = ev.normalized_fields || {};
            const badge = getEventBadge(ev.event_type);
            const BadgeIcon = badge.icon;
            const timeStr = ev.timestamp_utc ? ev.timestamp_utc.slice(11, 19) + " UTC" : "Timestamp N/A";
            const dateStr = ev.timestamp_utc ? ev.timestamp_utc.slice(0, 10) : "";

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="group p-3.5 rounded-lg border border-cyber-border bg-cyber-card hover:bg-cyber-surface hover:border-sky-500/60 transition-all cursor-pointer shadow-sm flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Sequence and Time */}
                  <div className="shrink-0 text-left font-mono">
                    <span className="text-xs font-bold text-sky-400 block">
                      {timeStr}
                    </span>
                    <span className="text-[10px] text-cyber-dim block mt-0.5">
                      {dateStr}
                    </span>
                    <span className="text-[9px] text-cyber-dim block px-1.5 py-0.2 rounded bg-cyber-surface border border-cyber-border mt-1">
                      {ev.source_record_id}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 font-semibold ${badge.style}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>

                      {norm.process_name && (
                        <span className="font-mono text-xs text-cyber-text font-bold">
                          {norm.process_name} {norm.pid && <span className="text-cyber-dim font-normal">[{norm.pid}]</span>}
                        </span>
                      )}

                      {norm.user && (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                          <User className="w-3 h-3" /> {norm.user}
                        </span>
                      )}

                      {norm.dest_ip && (
                        <span className="text-[11px] text-purple-300 font-mono">
                          &rarr; {norm.dest_ip}:{norm.dest_port}
                        </span>
                      )}
                    </div>

                    {/* Command line or description */}
                    <p className="text-xs text-cyber-muted font-mono truncate leading-normal bg-cyber-surface/40 p-1.5 rounded border border-cyber-border/40">
                      {norm.command_line || norm.file_path || norm.description || "System telemetry event logged"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-center">
                  <span className="text-[11px] font-mono text-cyber-dim group-hover:text-sky-400 transition-colors flex items-center gap-1">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
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
