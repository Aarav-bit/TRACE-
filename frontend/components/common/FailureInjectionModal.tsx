import React, { useState } from "react";
import { AlertTriangle, Bug, X, Zap } from "lucide-react";
import { injectFailure } from "@/lib/api";

interface FailureInjectionModalProps {
  investigationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FailureInjectionModal: React.FC<FailureInjectionModalProps> = ({
  investigationId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedType, setSelectedType] = useState<string>("query_failed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInject = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await injectFailure(investigationId, selectedType);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to arm simulated failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-cyber-card border border-amber-600/60 rounded-lg shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4 border-b border-cyber-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-950/80 border border-amber-600/80 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-cyber-text">
                Simulate Telemetry Disruption &amp; Evasion
              </h3>
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
                Autonomous Resilience &amp; Replanning Verification
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-cyber-muted hover:text-cyber-text p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-cyber-muted mb-4 leading-relaxed">
          Simulate a real forensic tool failure to observe the autonomous agent&apos;s
          error classification, bounded idempotent retry, and adaptive replanning loop.
        </p>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2.5 mb-6">
          <label
            className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
              selectedType === "query_failed"
                ? "bg-amber-950/40 border-amber-500 text-cyber-text"
                : "bg-cyber-surface border-cyber-border text-cyber-muted hover:border-cyber-borderLight"
            }`}
          >
            <input
              type="radio"
              name="failure"
              value="query_failed"
              checked={selectedType === "query_failed"}
              onChange={() => setSelectedType("query_failed")}
              className="mt-1 text-amber-500 focus:ring-amber-500"
            />
            <div>
              <span className="font-semibold text-xs text-cyber-text block">
                Endpoint Query Connection Failure (ECONNRESET)
              </span>
              <span className="text-[11px] text-cyber-dim block mt-0.5">
                Simulates an endpoint telemetry query disruption, triggering agent retry and fallback to cache.
              </span>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
              selectedType === "tool_timeout"
                ? "bg-amber-950/40 border-amber-500 text-cyber-text"
                : "bg-cyber-surface border-cyber-border text-cyber-muted hover:border-cyber-borderLight"
            }`}
          >
            <input
              type="radio"
              name="failure"
              value="tool_timeout"
              checked={selectedType === "tool_timeout"}
              onChange={() => setSelectedType("tool_timeout")}
              className="mt-1 text-amber-500 focus:ring-amber-500"
            />
            <div>
              <span className="font-semibold text-xs text-cyber-text block">
                Forensic Tool Execution Timeout (&gt;15s)
              </span>
              <span className="text-[11px] text-cyber-dim block mt-0.5">
                Simulates a hung external inspection process, triggering safety watchdog and tool substitution.
              </span>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
              selectedType === "corrupt_artifact"
                ? "bg-amber-950/40 border-amber-500 text-cyber-text"
                : "bg-cyber-surface border-cyber-border text-cyber-muted hover:border-cyber-borderLight"
            }`}
          >
            <input
              type="radio"
              name="failure"
              value="corrupt_artifact"
              checked={selectedType === "corrupt_artifact"}
              onChange={() => setSelectedType("corrupt_artifact")}
              className="mt-1 text-amber-500 focus:ring-amber-500"
            />
            <div>
              <span className="font-semibold text-xs text-cyber-text block">
                Corrupt Artifact Stream Anomaly
              </span>
              <span className="text-[11px] text-cyber-dim block mt-0.5">
                Forces parser stream exception, testing recovery from malformed input records.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-cyber-surface hover:bg-cyber-panel border border-cyber-border text-xs text-cyber-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleInject}
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-black" />
            {isSubmitting ? "Arming Failure..." : "Arm Failure Injection"}
          </button>
        </div>
      </div>
    </div>
  );
};
