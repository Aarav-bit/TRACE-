"use client";

import React from "react";

interface CircularGaugeProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string; // hex or tailwind class
  trackColor?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  label,
  sublabel,
  size = 130,
  strokeWidth = 12,
  color = "#a3e635", // Vibrant neon lime from inspiration Image 2
  trackColor = "#f1f5f9",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        {/* Animated fill circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
        <span className="text-xl font-bold tracking-tight text-slate-800 font-sans">
          {label !== undefined ? label : `${clampedValue}%`}
        </span>
        {sublabel && (
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default CircularGauge;
