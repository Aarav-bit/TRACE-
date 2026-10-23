"use client";

import React from "react";
import { Cpu, Wifi, Sparkles } from "lucide-react";

interface GradientCardProps {
  modelName?: string;
  mode?: "adaptive" | "local";
  activeCase?: string;
  isOnline?: boolean;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  modelName = "nemotron-3.5-super-vl-120b",
  mode = "adaptive",
  activeCase = "IR-2026-ACTIVE",
  isOnline = true,
}) => {
  return (
    <div className="relative w-full h-[200px] rounded-[28px] overflow-hidden p-6 text-white shadow-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl select-none bg-gradient-to-br from-[#6b8cce] via-[#85a8ea] to-[#97baf7]">
      {/* Background glow and subtle mesh circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-blue-700/20 blur-xl pointer-events-none" />

      {/* Card Header: Chip and Brand */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* EMV Microchip aesthetic */}
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-600/30 shadow-inner flex items-center justify-center p-0.5">
            <div className="w-full h-full border border-amber-600/30 rounded-sm grid grid-cols-2 gap-0.5 opacity-80">
              <div className="border-r border-amber-700/30" />
              <div className="border-l border-amber-700/30" />
            </div>
          </div>
          <Wifi className="w-4 h-4 text-white/80 rotate-90" />
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[11px] font-medium tracking-wide">
          <Sparkles className="w-3 h-3 text-amber-200" />
          <span>NVIDIA NIM 120B</span>
        </div>
      </div>

      {/* Model Spec & Title */}
      <div className="relative z-10 mt-5">
        <div className="text-[10px] tracking-wider uppercase font-semibold text-white/70">
          Forensic Reasoning Engine
        </div>
        <div className="text-sm font-mono font-bold tracking-tight text-white drop-shadow-sm truncate">
          {modelName}
        </div>
      </div>

      {/* Card Footer: Metadata and Status */}
      <div className="relative z-10 mt-5 flex items-end justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-white/70 font-medium">
            Active Target
          </div>
          <div className="text-xs font-semibold text-white tracking-wide truncate max-w-[170px]">
            {activeCase}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-white/70 font-medium">
              Engine State
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-lime-300 animate-pulse" : "bg-amber-300"}`} />
              <span className="text-xs font-semibold text-white capitalize">
                {isOnline ? "Operational" : "Offline"}
              </span>
            </div>
          </div>
          {/* Dual overlapping circles brand symbol (like Mastercard in image 1) */}
          <div className="relative w-8 h-5 flex items-center ml-2">
            <div className="w-5 h-5 rounded-full bg-rose-400/90 shadow-sm absolute left-0" />
            <div className="w-5 h-5 rounded-full bg-amber-400/90 shadow-sm absolute right-0" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradientCard;
