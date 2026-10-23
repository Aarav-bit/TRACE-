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
  HelpCircle,
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
    <aside className="h-full py-4 pl-4 pr-1 flex flex-col shrink-0 select-none z-30">
      <div className="w-[68px] h-full bg-[#111317] rounded-[32px] shadow-2xl border border-slate-800/80 flex flex-col items-center justify-between py-5 px-2">
        {/* Top Logo / Brand Circle (Vibrant Neon Lime from Image 2) */}
        <Link
          href="/"
          className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-lime-400 text-black shadow-lg shadow-lime-400/20 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Shield className="w-5 h-5 fill-black stroke-black" />
          {/* Tooltip */}
          <span className="absolute left-[80px] bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-50">
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
                      ? "bg-white text-slate-900 shadow-md font-bold scale-100"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 hover:scale-105 active:scale-95"
                  }`}
                >
                  <Icon className="w-5 h-5" />

                  {/* Active Indicator dot */}
                  {isActive && (
                    <span className="absolute -right-1 w-1.5 h-1.5 rounded-full bg-lime-400" />
                  )}
                </Link>

                {/* Smooth Hover Tooltip Pill */}
                <div className="absolute left-[76px] bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 border border-slate-700/60 translate-x-1 group-hover:translate-x-0">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Status / Help */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/settings"
            title="Engine Health"
            className="w-10 h-10 rounded-2xl bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
          >
            <Activity className="w-4 h-4 text-lime-400 animate-pulse" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
            DFIR
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Dock;
