import React from "react";
import { GitBranch, Cpu, AlertTriangle, ShieldCheck, User, Terminal, ExternalLink } from "lucide-react";
import { ProcessTreeData, ProcessNode } from "@/lib/types";

interface ProcessTreeViewProps {
  treeData: ProcessTreeData | null;
  onSelectEvidenceId?: (id: string) => void;
}

const TreeNode: React.FC<{
  node: ProcessNode;
  level?: number;
  onSelectEvidenceId?: (id: string) => void;
}> = ({ node, level = 0, onSelectEvidenceId }) => {
  const isObserved = node.relationship_class === "observed";

  return (
    <div className="space-y-2 relative" style={{ marginLeft: `${level * 28}px` }}>
      {/* Node Card */}
      <div
        className={`p-3.5 rounded-lg border transition-all ${
          isObserved
            ? "bg-cyber-card border-cyber-border hover:border-sky-500/80"
            : "bg-amber-950/20 border-amber-800/60 hover:border-amber-500"
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2">
            <Cpu className={`w-4 h-4 ${isObserved ? "text-sky-400" : "text-amber-400"}`} />
            <span className="font-mono text-xs font-bold text-cyber-text">
              {node.name}
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-cyber-surface border border-cyber-border text-sky-300">
              PID {node.pid}
            </span>
            {node.ppid && (
              <span className="font-mono text-[11px] text-cyber-dim">
                (PPID {node.ppid})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                isObserved
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                  : "bg-amber-950/60 text-amber-300 border-amber-800"
              }`}
            >
              {isObserved ? "Observed Creation (EID 4688)" : "Inferred / Gap"}
            </span>

            {node.evidence_id && onSelectEvidenceId && (
              <button
                onClick={() => onSelectEvidenceId(node.evidence_id!)}
                className="p-1 rounded hover:bg-cyber-surface text-sky-400 text-xs"
                title="Inspect evidence record"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Command Line & Context */}
        {node.command_line && (
          <p className="text-xs font-mono text-amber-300 bg-cyber-bg/80 p-2 rounded border border-cyber-border/60 break-all leading-relaxed mb-2">
            {node.command_line}
          </p>
        )}

        <div className="flex items-center gap-4 text-[11px] font-mono text-cyber-dim">
          {node.user && (
            <span className="flex items-center gap-1 text-emerald-400">
              <User className="w-3 h-3" /> {node.user}
            </span>
          )}
          {node.timestamp_utc && (
            <span>Timestamp: {node.timestamp_utc.slice(11, 19)} UTC</span>
          )}
          {node.parent_name && (
            <span>Parent: {node.parent_name}</span>
          )}
        </div>
      </div>

      {/* Children Recursion */}
      {node.children && node.children.length > 0 && (
        <div className="space-y-2 border-l-2 border-cyber-border/80 pl-2">
          {node.children.map((child) => (
            <TreeNode
              key={child.pid}
              node={child}
              level={level + 1}
              onSelectEvidenceId={onSelectEvidenceId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProcessTreeView: React.FC<ProcessTreeViewProps> = ({ treeData, onSelectEvidenceId }) => {
  if (!treeData) {
    return (
      <div className="p-12 text-center text-xs text-cyber-dim bg-cyber-card border border-cyber-border rounded-lg m-6">
        No process ancestry reconstructed yet. Start or execute the investigation.
      </div>
    );
  }

  const { process_tree = [], missing_parents = [], unanchored_executions = [] } = treeData;

  return (
    <div className="flex flex-col h-full bg-cyber-bg p-6 space-y-6 overflow-y-auto">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between">
          <span className="text-xs text-cyber-muted font-mono">Observed Executions:</span>
          <span className="text-sm font-bold text-sky-400 font-mono">
            {treeData.total_observed}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between">
          <span className="text-xs text-cyber-muted font-mono">Missing Parent Telemetry:</span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {missing_parents.length}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between">
          <span className="text-xs text-cyber-muted font-mono">Unanchored Sockets/Files:</span>
          <span className="text-sm font-bold text-rose-400 font-mono">
            {unanchored_executions.length}
          </span>
        </div>
      </div>

      {/* Missing Parent Warnings if any */}
      {missing_parents.length > 0 && (
        <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/60 text-xs text-amber-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Evidentiary Gap: Unobserved Parent Process(es)</span>
          </div>
          {missing_parents.map((mp, idx) => (
            <p key={idx} className="font-mono text-[11px] text-cyber-muted">
              Child <span className="text-cyber-text font-bold">{mp.child_name} [PID {mp.child_pid}]</span> reported parent PID <span className="text-amber-400">{mp.missing_parent_pid} ({mp.missing_parent_name})</span>, but creation record was absent.
            </p>
          ))}
        </div>
      )}

      {/* Unanchored telemetry warnings */}
      {unanchored_executions.length > 0 && (
        <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-800/60 text-xs text-rose-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Degraded Telemetry: Process Executed Without EID 4688</span>
          </div>
          {unanchored_executions.map((ue, idx) => (
            <p key={idx} className="font-mono text-[11px] text-cyber-muted">
              PID <span className="text-cyber-text font-bold">{ue.pid} ({ue.name})</span>: {ue.reason}
            </p>
          ))}
        </div>
      )}

      {/* Process Trees */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-sky-400" />
          <span>Observed Parent-Child Process Trees</span>
        </h3>
        <div className="space-y-4">
          {process_tree.map((root) => (
            <TreeNode
              key={root.pid}
              node={root}
              level={0}
              onSelectEvidenceId={onSelectEvidenceId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
