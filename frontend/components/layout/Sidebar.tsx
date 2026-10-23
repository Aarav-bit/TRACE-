"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Compass,
  FileSearch,
  History,
  Wrench,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Case Intake & Ingestion", href: "/investigations", icon: Compass },
  { label: "Evidence Explorer", href: "/evidence", icon: FileSearch },
  { label: "Audit & Chain of Custody", href: "/history", icon: History },
  { label: "Forensic Tool Registry", href: "/tools", icon: Wrench },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-cyber-card border-r border-cyber-border flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-cyber-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-500/50 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950/50">
          <ShieldAlert className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-widest text-sky-400 font-mono">
              TRACE
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
              DFIR
            </span>
          </div>
          <p className="text-[10px] text-cyber-muted font-mono tracking-tight">
            Threat Reconstruction & Cyber Evidence
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono uppercase text-cyber-dim tracking-wider">
          Forensics Workspace
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? "bg-sky-950/60 text-sky-300 border border-sky-700/60 shadow-sm"
                  : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/60 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-cyber-dim"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      <div className="p-4 border-t border-cyber-border bg-cyber-surface/40">
        <div className="rounded border border-cyber-border p-3 bg-cyber-bg/60">
          <div className="flex items-center justify-between text-[11px] font-mono text-cyber-muted mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Investigation Core
            </span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
          <p className="text-[10px] text-cyber-dim leading-relaxed">
            Deterministic verifier online. SHA-256 chain of custody and artifact provenance active.
          </p>
        </div>
      </div>
    </aside>
  );
};
