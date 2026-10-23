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
        style: "bg-sky-50 text-sky-800 border-sky-200",
      };
    }
    if (t.includes("network") || t.includes("socket")) {
      return {
        icon: Network,
        label: "Network Connection",
        style: "bg-purple-50 text-purple-800 border-purple-200",
      };
    }
    if (t.includes("file")) {
      return {
        icon: HardDrive,
        label: "File Activity",
        style: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
    if (t.includes("logon")) {
      return {
        icon: User,
        label: "Account Logon",
        style: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    return {
      icon: Clock,
      label: type,
      style: "bg-slate-100 text-slate-700 border-slate-200",
    };
  };

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search processes, command lines, users, destination IPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-mono"
          />
        </div>

        {/* Quick Filter Category Pills (Inspired by Image 4 Pill Selector) */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#111317] text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60"
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-75 font-mono">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Event Stream */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
            No forensic events matched your filter criteria.
          </div>
        ) : (
          filtered.map((ev) => {
            const norm = ev.normalized_fields || {};
            const badge = getEventBadge(ev.event_type);
            const BadgeIcon = badge.icon;
            const timeStr = ev.timestamp_utc ? ev.timestamp_utc.slice(11, 19) + " UTC" : "Timestamp N/A";
            const dateStr = ev.timestamp_utc ? ev.timestamp_utc.slice(0, 10) : "";

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="group p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Sequence and Time */}
                  <div className="shrink-0 text-left font-mono">
                    <span className="text-xs font-bold text-slate-900 block">
                      {timeStr}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {dateStr}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mt-1 inline-block">
                      EID {norm.event_id || "SYS"}
                    </span>
                  </div>

                  {/* Icon & Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.style}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      {norm.user && (
                        <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                          <User className="w-2.5 h-2.5 text-slate-400" />
                          <span>{norm.user}</span>
                        </span>
                      )}

                      {norm.pid && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200/80 px-1.5 py-0.2 rounded-md">
                          PID: {norm.pid}
                        </span>
                      )}
                    </div>

                    {/* Primary Command Line or Description */}
                    <div className="font-mono text-xs text-slate-800 break-all bg-slate-50 border border-slate-100 p-2 rounded-xl group-hover:bg-slate-100/70 transition-colors">
                      {norm.command_line || norm.file_path || norm.description || JSON.stringify(norm)}
                    </div>
                  </div>
                </div>

                {/* Right Arrow indicator */}
                <div className="shrink-0 self-center">
                  <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TimelineView;
