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
        No correlation relationships generated yet. Run the multi-pivot correlation tool or live investigation.
      </div>
    );
  }

  // Format React Flow nodes with custom styled cards
  const flowNodes: Node[] = useMemo(() => {
    return graphData.nodes.map((n, idx) => {
      const type = n.data?.type || n.type || "entity";
      let bg = "#131C31";
      let border = "#233354";
      let text = "#F8FAFC";

      if (type.includes("user")) {
        bg = "#064E3B";
        border = "#10B981";
      } else if (type.includes("process")) {
        bg = "#0C2B4E";
        border = "#38BDF8";
      } else if (type.includes("file")) {
        bg = "#451A03";
        border = "#F59E0B";
      } else if (type.includes("finding")) {
        bg = "#2E1065";
        border = "#A855F7";
      }

      return {
        id: n.id,
        position: n.position || { x: (idx % 3) * 260 + 50, y: Math.floor(idx / 3) * 150 + 50 },
        data: {
          label: (
            <div className="p-2.5 rounded font-mono text-xs select-none">
              <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75 mb-0.5">
                {type}
              </span>
              <span className="font-bold block leading-tight">{n.data?.label || n.id}</span>
            </div>
          ),
          raw: n.data,
        },
        style: {
          backgroundColor: bg,
          border: `1.5px solid ${border}`,
          borderRadius: "8px",
          color: text,
          width: 220,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
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
      labelBgStyle: { fill: "#0D1322", stroke: "#233354" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#38BDF8",
        width: 15,
        height: 15,
      },
    }));
  }, [graphData.edges]);

  return (
    <div className="w-full h-full bg-cyber-bg relative">
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
          maskColor="rgba(11, 15, 25, 0.85)"
          className="bg-cyber-card border border-cyber-border rounded"
        />
      </ReactFlow>
    </div>
  );
};
