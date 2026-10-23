"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  FileSearch,
  Wrench,
  Settings,
  Shield,
  Activity,
} from "lucide-react";

interface DockItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const DOCK_ITEMS: DockItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Case Intake", href: "/investigations", icon: Compass },
  { label: "Evidence Explorer", href: "/evidence", icon: FileSearch },
  { label: "Forensic Tools", href: "/tools", icon: Wrench },
  { label: "Settings & AI", href: "/settings", icon: Settings },
];

export const Dock: React.FC = () => {
  const pathname = usePathname();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <aside className="h-full py-3 pl-3 pr-1 flex flex-col shrink-0 select-none z-30">
      <div className="w-[66px] h-full bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.05)] border border-slate-200/90 flex flex-col items-center justify-between py-5 px-2">
        {/* Top Logo / Brand Circle (Refined Cyber Accent) */}
        <Link
          href="/"
          className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-lime-300 hover:bg-lime-400 text-slate-950 border border-lime-400/60 shadow-sm hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Shield className="w-5 h-5 fill-slate-950 stroke-slate-950" />
          {/* Tooltip */}
          <span className="absolute left-[78px] bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-50">
            TRACE Forensics
          </span>
        </Link>

        {/* Center Navigation Icons */}
        <div className="flex flex-col items-center gap-3 w-full">
          {DOCK_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <div
                key={item.href}
                className="relative group flex items-center justify-center w-full"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <Link
                  href={item.href}
                  className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/15 scale-100"
                      : "text-slate-400 hover:text-slate-800 hover:bg-slate-100/90 hover:scale-105 active:scale-95"
                  }`}
                >
                  <Icon className="w-5 h-5" />

                  {/* Active Indicator dot */}
                  {isActive && (
                    <span className="absolute -right-1 w-1.5 h-1.5 rounded-full bg-lime-500 shadow-sm" />
                  )}
                </Link>

                {/* Smooth Hover Tooltip Pill */}
                <div className="absolute left-[74px] bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 border border-slate-800 translate-x-1 group-hover:translate-x-0">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Status / Help */}
        <div className="flex flex-col items-center gap-2.5">
          <Link
            href="/settings"
            title="Engine Health"
            className="w-10 h-10 rounded-2xl bg-slate-100/80 text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200/60 flex items-center justify-center transition-all shadow-sm"
          >
            <Activity className="w-4 h-4 text-lime-600 animate-pulse" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[10px] font-mono font-bold text-slate-600">
            DFIR
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Dock;
