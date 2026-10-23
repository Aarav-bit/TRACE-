"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Info, User, Terminal, HardDrive, ShieldCheck } from "lucide-react";

interface EvidenceGraphProps {
  graphData: {
    nodes: any[];
    edges: any[];
  } | null;
  onSelectNode?: (nodeData: any) => void;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ graphData, onSelectNode }) => {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-cyber-dim bg-cyber-card border border-cyber-border rounded-lg m-6">
        No correlation relationships generated yet. Run the multi-pivot correlation tool or launch an investigation.
      </div>
    );
  }

  // Format React Flow nodes with custom styled cards
  const flowNodes: Node[] = useMemo(() => {
    return graphData.nodes.map((n, idx) => {
      const type = n.data?.type || n.type || "entity";
      let bg = "#111726";
      let border = "#1E293B";
      let text = "#F8FAFC";
      let typeLabel = "Entity";

      if (type.includes("user")) {
        bg = "#064E3B";
        border = "#10B981";
        typeLabel = "User Account";
      } else if (type.includes("process")) {
        bg = "#0C2B4E";
        border = "#38BDF8";
        typeLabel = "Process Execution";
      } else if (type.includes("file")) {
        bg = "#451A03";
        border = "#F59E0B";
        typeLabel = "File Activity";
      } else if (type.includes("finding")) {
        bg = "#2E1065";
        border = "#A855F7";
        typeLabel = "Verified Finding";
      }

      return {
        id: n.id,
        position: n.position || { x: (idx % 3) * 280 + 50, y: Math.floor(idx / 3) * 160 + 60 },
        data: {
          label: (
            <div className="p-3 font-mono text-xs select-none">
              <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75 mb-1">
                {typeLabel}
              </span>
              <span className="font-bold block leading-snug truncate" title={n.data?.label || n.id}>
                {n.data?.label || n.id}
              </span>
            </div>
          ),
          raw: n.data,
        },
        style: {
          backgroundColor: bg,
          border: `1.5px solid ${border}`,
          borderRadius: "8px",
          color: text,
          width: 240,
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
        },
      };
    });
  }, [graphData.nodes]);

  // Format React Flow edges with labels and arrows
  const flowEdges: Edge[] = useMemo(() => {
    return graphData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated || false,
      style: { stroke: "#38BDF8", strokeWidth: 1.5 },
      labelStyle: { fill: "#94A3B8", fontWeight: 600, fontSize: 10, fontFamily: "monospace" },
      labelBgStyle: { fill: "#111726", stroke: "#1E293B" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#38BDF8",
        width: 14,
        height: 14,
      },
    }));
  }, [graphData.edges]);

  return (
    <div className="w-full h-full bg-cyber-bg relative">
      {/* Floating Legend */}
      <div className="absolute top-4 left-4 z-10 p-3 rounded-lg bg-cyber-card/90 backdrop-blur-md border border-cyber-border shadow-lg space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-cyber-text text-[11px] uppercase tracking-wider font-mono">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Graph Legend</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>User Accounts</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Processes</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Files &amp; Payloads</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Verified Findings</span>
          </div>
        </div>
        <div className="text-[10px] text-cyber-dim pt-1 border-t border-cyber-border/60">
          Click any node to inspect its raw forensic log record.
        </div>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodeClick={(_, node) => onSelectNode && onSelectNode(node.data?.raw)}
        fitView
      >
        <Background color="#1E293B" gap={20} size={1} />
        <Controls className="bg-cyber-surface border border-cyber-border fill-cyber-text" />
        <MiniMap
          nodeColor={() => "#38BDF8"}
          maskColor="rgba(11, 15, 23, 0.85)"
          className="bg-cyber-card border border-cyber-border rounded"
        />
      </ReactFlow>
    </div>
  );
};
