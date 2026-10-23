"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  FolderOpen,
  Plus,
  ChevronDown,
  Check,
  Search,
  Layers,
} from "lucide-react";
import { fetchCases } from "@/lib/api";
import { Case } from "@/lib/types";

const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Case Intake", href: "/investigations" },
  { label: "Evidence", href: "/evidence" },
  { label: "ML Triage", href: "/triage" },
  { label: "History", href: "/history" },
  { label: "Tools", href: "/tools" },
  { label: "Settings", href: "/settings" },
];

export const TopNavbar: React.FC = () => {
  const pathname = usePathname();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCases()
      .then((data) => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCaseId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const filteredCases = cases.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3 flex items-center justify-between pointer-events-auto bg-white/45 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.06)] transition-all">
      {/* Left: Glass Emblem Logo */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_2px_10px_rgba(99,102,241,0.12)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.2)] active:scale-95 transition-all"
          title="TRACE Forensics"
        >
          <ShieldAlert className="w-5 h-5 text-accent transition-transform group-hover:scale-110" />
        </Link>
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold text-sm tracking-tight text-navy">TRACE</span>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
              DFIR
            </span>
          </div>
          <span className="text-[11px] text-ink-secondary/80 font-medium">Autonomous Forensics</span>
        </div>
      </div>

      {/* Center Floating Glassmorphic Pill Capsule */}
      <nav className="inline-flex items-center p-1 rounded-full bg-white/55 hover:bg-white/65 backdrop-blur-2xl border border-white/90 shadow-[0_4px_24px_rgba(99,102,241,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-4 sm:px-5 py-2 rounded-full transition-all text-xs sm:text-sm font-semibold flex flex-col items-center justify-center ${
                isActive
                  ? "bg-accent text-white shadow-[0_3px_12px_rgba(99,102,241,0.35)]"
                  : "text-ink-secondary hover:text-navy hover:bg-white/60 active:scale-98"
              }`}
            >
              <span>{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/90 mt-0.5 shadow-xs" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right Controls: Custom Glassmorphic Case Dropdown + Accent CTA */}
      <div className="flex items-center gap-3">
        {cases.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-white/90 shadow-[0_2px_12px_rgba(99,102,241,0.08)] rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy transition-all active:scale-98 max-w-[210px]"
            >
              <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <FolderOpen className="w-3 h-3 text-accent" />
              </div>
              <span className="truncate max-w-[120px] text-navy font-semibold text-xs text-left">
                {selectedCase ? selectedCase.name : "Select Case"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-200 shrink-0 ${
                  isOpen ? "rotate-180 text-accent" : ""
                }`}
              />
            </button>

            {/* Custom Floating Glass Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_12px_36px_rgba(15,23,42,0.12),0_4px_12px_rgba(99,102,241,0.08)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Search / Filter Input */}
                <div className="relative mb-2 px-1">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-ink-muted" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search investigations..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200/70 focus:outline-none focus:border-accent text-navy placeholder:text-ink-muted font-medium transition-colors"
                    autoFocus
                  />
                </div>

                {/* Case Items List */}
                <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                  {filteredCases.length === 0 ? (
                    <div className="p-3 text-center text-xs text-ink-muted font-medium">
                      No matching cases found
                    </div>
                  ) : (
                    filteredCases.map((c) => {
                      const isSelected = c.id === selectedCase?.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setIsOpen(false);
                            setSearchFilter("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-accent/10 text-accent font-semibold"
                              : "text-ink-secondary hover:text-navy hover:bg-slate-100/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <Layers
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? "text-accent" : "text-ink-muted"
                              }`}
                            />
                            <div className="truncate">
                              <div className="truncate text-navy font-semibold">
                                {c.name}
                              </div>
                              <div className="text-[10px] text-ink-muted truncate font-normal">
                                {c.id.slice(0, 8)}... • {c.event_count || 0} events
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-accent shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer Quick Action */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between px-1">
                  <span className="text-[10px] text-ink-muted font-medium">
                    {cases.length} Total Cases
                  </span>
                  <Link
                    href="/investigations"
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
                  >
                    <span>View all</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <Link
          href="/investigations"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold text-xs sm:text-sm shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Case</span>
        </Link>
      </div>
    </header>
  );
};
