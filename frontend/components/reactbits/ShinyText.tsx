"use client";

import React from "react";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = "",
}) => {
  return (
    <span
      className={`relative inline-block ${
        disabled
          ? "text-slate-800"
          : "bg-gradient-to-r from-slate-900 via-slate-500 to-slate-900 bg-[200%_auto] bg-clip-text text-transparent animate-shimmer"
      } ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
