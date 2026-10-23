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
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Case Intake", href: "/investigations", icon: Compass },
  { label: "Evidence Explorer", href: "/evidence", icon: FileSearch },
  { label: "Investigation History", href: "/history", icon: History },
  { label: "Forensic Tools", href: "/tools", icon: Wrench },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-cyber-card border-r border-cyber-border flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-cyber-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400">
          <ShieldAlert className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-wide text-cyber-text font-mono">
              TRACE
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
              DFIR
            </span>
          </div>
          <p className="text-[10px] text-cyber-dim font-mono truncate">
            Autonomous Forensics
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-cyber-dim tracking-wider">
          Workspace
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-sky-950/40 text-sky-300 font-semibold border border-sky-800/50"
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
      <div className="p-3 border-t border-cyber-border bg-cyber-surface/20">
        <div className="rounded border border-cyber-border/70 p-2.5 bg-cyber-surface/40">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="flex items-center gap-1.5 text-cyber-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Engine Status
            </span>
            <span className="text-emerald-400 font-bold">READY</span>
          </div>
          <p className="text-[10px] text-cyber-dim leading-relaxed">
            Independent verifier and cryptographic chain of custody active.
          </p>
        </div>
      </div>
    </aside>
  );
};
