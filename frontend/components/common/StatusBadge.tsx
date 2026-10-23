import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md", className = "" }) => {
  const norm = status?.toLowerCase() || "unknown";

  let styles = "bg-slate-800 text-slate-300 border-slate-700";
  let label = status;

  if (norm === "supported" || norm === "verified" || norm === "completed" || norm === "active") {
    styles = "bg-emerald-950/70 text-emerald-300 border-emerald-800/80";
    label = norm === "supported" ? "Verified Supported" : status;
  } else if (norm === "unresolved" || norm === "retrying" || norm === "warning" || norm === "pending") {
    styles = "bg-amber-950/70 text-amber-300 border-amber-800/80";
    label = norm === "unresolved" ? "Evidentiary Gap / Unresolved" : status;
  } else if (norm === "contradicted" || norm === "failed" || norm === "blocked" || norm === "stopped") {
    styles = "bg-rose-950/70 text-rose-300 border-rose-800/80";
    label = norm === "contradicted" ? "Contradicted Claim" : status;
  } else if (norm === "running") {
    styles = "bg-sky-950/70 text-sky-300 border-sky-800/80 animate-pulse";
    label = "Running Tool...";
  } else if (norm === "replanned") {
    styles = "bg-purple-950/70 text-purple-300 border-purple-800/80";
    label = "Replanned Strategy";
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border uppercase tracking-wider font-mono ${sizeClasses} ${styles} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          norm === "running"
            ? "bg-sky-400 animate-ping"
            : norm === "supported" || norm === "completed"
            ? "bg-emerald-400"
            : norm === "unresolved"
            ? "bg-amber-400"
            : norm === "contradicted" || norm === "failed"
            ? "bg-rose-400"
            : "bg-slate-400"
        }`}
      />
      {label}
    </span>
  );
};
