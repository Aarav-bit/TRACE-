"use client";

import React from "react";
import {
  Cpu,
  AlertTriangle,
  User,
  ExternalLink,
  Info,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
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
    <div className="space-y-2 relative" style={{ marginLeft: `${level * 24}px` }}>
      {/* Node Card */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isObserved
            ? "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md"
            : "bg-amber-50/50 border-amber-200/80 hover:border-amber-300 hover:shadow-md"
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`p-1.5 rounded-xl ${isObserved ? "bg-slate-100 text-slate-800" : "bg-amber-100 text-amber-800"}`}>
              <Cpu className="w-4 h-4" />
            </div>
            <span className="font-mono text-xs font-bold text-slate-900">
              {node.name}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
              PID {node.pid}
            </span>
            {node.ppid && (
              <span className="font-mono text-[10px] text-slate-400">
                (Parent PID {node.ppid})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isObserved
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {isObserved ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Observed Log</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-3 h-3 text-amber-600" />
                  <span>Inferred Parent</span>
                </>
              )}
            </span>

            {node.evidence_id && onSelectEvidenceId && (
              <button
                onClick={() => onSelectEvidenceId(node.evidence_id!)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                title="Inspect evidence record"
              >
                <span>Inspect</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Command Line & Context */}
        {node.command_line && (
          <p className="text-xs font-mono text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 break-all leading-relaxed mb-2">
            {node.command_line}
          </p>
        )}

        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 flex-wrap">
          {node.user && (
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <User className="w-3 h-3 text-slate-400" /> {node.user}
            </span>
          )}
          {node.timestamp_utc && (
            <span>Executed: {node.timestamp_utc.slice(11, 19)} UTC</span>
          )}
          {node.parent_name && (
            <span>Parent Process: <span className="text-slate-700 font-semibold">{node.parent_name}</span></span>
          )}
        </div>
      </div>

      {/* Children Recursion */}
      {node.children && node.children.length > 0 && (
        <div className="space-y-2 border-l-2 border-slate-200 pl-3 mt-2">
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
      <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl m-6">
        No process ancestry reconstructed yet. Ingest evidence and launch the investigation.
      </div>
    );
  }

  const { process_tree = [], missing_parents = [], unanchored_executions = [] } = treeData;

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-4 overflow-y-auto">
      {/* Explanation Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs flex items-start gap-3">
        <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="leading-relaxed text-slate-600">
          <span className="font-bold text-slate-900 block mb-0.5">
            How Process Lineage Works
          </span>
          TRACE reconstructs execution lineage from Windows Security Event ID 4688 and Sysmon Event ID 1.
          Green badges indicate <strong>Observed Executions</strong> directly captured in logs.
          Amber badges indicate <strong>Inferred Parents</strong> where child processes reported a parent PID whose initial creation record was unlogged.
        </div>
      </div>

      {/* Overview Stats (Bento 3-Card Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Observed Executions:</span>
          <span className="text-sm font-bold text-slate-900 font-mono">
            {treeData.total_observed}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Inferred Gaps:</span>
          <span className="text-sm font-bold text-amber-600 font-mono">
            {treeData.missing_parents?.length || 0}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Lineage Completeness:</span>
          <span className="text-sm font-bold text-lime-600 font-mono">
            {(treeData.missing_parents?.length || 0) === 0 ? "100% Unbroken" : `${treeData.total_observed} Rooted`}
          </span>
        </div>
      </div>

      {/* Process Hierarchy Tree */}
      <div className="space-y-4">
        {process_tree.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
            No parent-child process chains identified.
          </div>
        ) : (
          process_tree.map((rootNode) => (
            <TreeNode
              key={rootNode.pid}
              node={rootNode}
              level={0}
              onSelectEvidenceId={onSelectEvidenceId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProcessTreeView;
