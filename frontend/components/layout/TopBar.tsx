"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Plus,
  FolderOpen,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { fetchCases } from "@/lib/api";
import { Case } from "@/lib/types";

const NAV_LINKS = [
  { label: "Overview", href: "/" },
  { label: "Case Intake", href: "/investigations" },
  { label: "Evidence", href: "/evidence" },
  { label: "History", href: "/history" },
  { label: "Tools", href: "/tools" },
  { label: "Settings", href: "/settings" },
];

export const TopBar: React.FC = () => {
  const pathname = usePathname();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>("");

  useEffect(() => {
    fetchCases()
      .then((data) => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCase(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title (Matching Uploaded Image) */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-105 transition-all">
            <Shield className="w-4 h-4 fill-indigo-600/20 stroke-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 font-sans">
                TRACE
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                DFIR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-none">
              Autonomous Forensics
            </p>
          </div>
        </Link>

        {/* Center: Floating Pill Navigation Bar (Matching Uploaded Image) */}
        <nav className="hidden md:flex items-center p-1 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-inner">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 scale-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Active Case Dropdown & + New Case Pill (Matching Uploaded Image) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Case Selector Pill */}
          <div className="relative flex items-center">
            <FolderOpen className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs font-medium rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer appearance-none shadow-sm max-w-[150px] sm:max-w-[180px] truncate"
            >
              {cases.length === 0 ? (
                <option value="">No Active Cases</option>
              ) : (
                cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>

          {/* + New Case Button (Matching Royal Indigo in Uploaded Image) */}
          <Link
            href="/investigations"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Case</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
