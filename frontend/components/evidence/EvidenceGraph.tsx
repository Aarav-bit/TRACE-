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
import { Info, User, Terminal, HardDrive, ShieldCheck, Network } from "lucide-react";

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
      <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl m-6">
        No correlation relationships generated yet. Run the multi-pivot correlation tool or launch an investigation.
      </div>
    );
  }

  // Format React Flow nodes with custom styled cards
  const flowNodes: Node[] = useMemo(() => {
    return graphData.nodes.map((n, idx) => {
      const type = n.data?.type || n.type || "entity";
      let badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
      let typeLabel = "Entity";

      if (type.includes("user")) {
        badgeBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
        typeLabel = "User Account";
      } else if (type.includes("process")) {
        badgeBg = "bg-sky-100 text-sky-800 border-sky-200";
        typeLabel = "Process Execution";
      } else if (type.includes("file")) {
        badgeBg = "bg-amber-100 text-amber-800 border-amber-200";
        typeLabel = "File Dropper";
      } else if (type.includes("network")) {
        badgeBg = "bg-purple-100 text-purple-800 border-purple-200";
        typeLabel = "C2 / Socket";
      }

      return {
        id: n.id,
        position: n.position || { x: (idx % 3) * 280 + 50, y: Math.floor(idx / 3) * 160 + 50 },
        data: {
          label: (
            <div className="p-3 text-left">
              <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border inline-block mb-1 ${badgeBg}`}>
                {typeLabel}
              </span>
              <div className="font-mono text-xs font-bold text-slate-900 truncate max-w-[200px]">
                {n.data?.label || n.id}
              </div>
              {n.data?.subtitle && (
                <div className="font-mono text-[10px] text-slate-500 truncate mt-0.5 max-w-[200px]">
                  {n.data.subtitle}
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          minWidth: 200,
        },
      };
    });
  }, [graphData]);

  const flowEdges: Edge[] = useMemo(() => {
    return (graphData.edges || []).map((e, idx) => ({
      id: e.id || `edge-${idx}`,
      source: e.source,
      target: e.target,
      label: e.label || e.relation || "",
      labelStyle: { fill: "#64748b", fontSize: 10, fontFamily: "monospace", fontWeight: 600 },
      labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9, rx: 6, ry: 6 },
      labelBgPadding: [6, 4] as [number, number],
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#64748b",
        width: 14,
        height: 14,
      },
    }));
  }, [graphData]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-200/80">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        onNodeClick={(_, node) => onSelectNode && onSelectNode(node)}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls className="bg-white rounded-xl shadow-md border border-slate-200" />
        <MiniMap
          nodeColor="#94a3b8"
          maskColor="rgba(241, 245, 249, 0.7)"
          className="bg-white rounded-xl shadow-md border border-slate-200"
        />
      </ReactFlow>

      {/* Floating Legend Badge */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-sm flex items-center gap-3 text-[11px] font-medium z-10">
        <span className="flex items-center gap-1 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> User
        </span>
        <span className="flex items-center gap-1 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Process
        </span>
        <span className="flex items-center gap-1 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> File
        </span>
        <span className="flex items-center gap-1 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Network
        </span>
      </div>
    </div>
  );
};

export default EvidenceGraph;
