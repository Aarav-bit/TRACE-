"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Info } from "lucide-react";

interface EvidenceGraphProps {
  graphData: {
    nodes: any[];
    edges: any[];
  } | null;
  onSelectNode?: (nodeData: any) => void;
}

// Custom styled card node component to support multi-directional connection handles
const CustomEvidenceNode = ({ data }: { data: any }) => {
  return (
    <div
      style={{
        backgroundColor: data.bg,
        border: `1.5px solid ${data.border}`,
        borderRadius: "10px",
        color: "#f8fafc",
        width: 250,
        boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
      }}
      className="p-3 font-mono text-center relative select-none transition-transform hover:scale-[1.02]"
    >
      <Handle type="target" position={Position.Top} className="!bg-sky-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-sky-400 !w-2 !h-2" />
      
      <span
        style={{ color: data.border }}
        className="text-[9px] uppercase font-bold tracking-wider block mb-1"
      >
        {data.typeLabel}
      </span>
      <span
        className="font-bold text-[11px] block leading-snug truncate"
        title={data.label}
      >
        {data.label}
      </span>

      <Handle type="source" position={Position.Bottom} className="!bg-sky-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-sky-400 !w-2 !h-2" />
    </div>
  );
};

const nodeTypes = {
  evidenceNode: CustomEvidenceNode,
};

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ graphData, onSelectNode }) => {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-[#0b0f19] border border-slate-800 rounded-xl m-4 font-mono">
        No correlation relationships generated yet. Run the multi-pivot correlation tool or launch an investigation.
      </div>
    );
  }

  // Format React Flow nodes with exact colors matching forensic specification
  const flowNodes: Node[] = useMemo(() => {
    // Separate by category for layout
    let userCount = 0;
    let procTopCount = 0;
    let procMidCount = 0;
    let findingCount = 0;

    return graphData.nodes.map((n, idx) => {
      const type = (n.data?.type || n.type || "entity").toLowerCase();
      let bg = "#0d1527";
      let border = "#1e293b";
      let typeLabel = "Entity";
      let calculatedX = (idx % 4) * 290 + 50;
      let calculatedY = Math.floor(idx / 4) * 170 + 60;

      if (type.includes("user")) {
        bg = "#033224";
        border = "#10b981";
        typeLabel = "USER ACCOUNT";
        calculatedX = userCount === 0 ? 50 : 630;
        calculatedY = userCount === 0 ? 60 : 230;
        userCount++;
      } else if (type.includes("process")) {
        bg = "#0a2540";
        border = "#0284c7";
        typeLabel = "PROCESS EXECUTION";
        if (procTopCount < 3) {
          calculatedX = 340 + procTopCount * 290;
          calculatedY = 60;
          procTopCount++;
        } else {
          calculatedX = 340 + procMidCount * 580;
          calculatedY = 230;
          procMidCount++;
        }
      } else if (type.includes("file")) {
        bg = "#381704";
        border = "#d97706";
        typeLabel = "FILE ACTIVITY";
        calculatedX = 50;
        calculatedY = 230;
      } else if (type.includes("finding")) {
        bg = "#290c47";
        border = "#9333ea";
        typeLabel = "VERIFIED FINDING";
        calculatedX = 50 + findingCount * 330;
        calculatedY = 400;
        findingCount++;
      }

      const position = n.position && (n.position.x !== 50 || n.position.y !== 50 || idx === 0)
        ? n.position
        : { x: calculatedX, y: calculatedY };

      return {
        id: n.id,
        type: "evidenceNode",
        position,
        data: {
          label: n.data?.label || n.id,
          typeLabel,
          bg,
          border,
          type,
          raw: n.data,
        },
      };
    });
  }, [graphData.nodes]);

  // Format React Flow edges with cyan lines, dark labels, and unique IDs
  const flowEdges: Edge[] = useMemo(() => {
    const validNodeIds = new Set(flowNodes.map((n) => n.id));
    const seenEdgeIds = new Set<string>();
    const edges: Edge[] = [];

    (graphData.edges || []).forEach((e, idx) => {
      if (!e.source || !e.target) return;
      if (!validNodeIds.has(e.source) || !validNodeIds.has(e.target)) return;

      const uniqueEdgeId = `${e.id || "e"}-${idx}`;
      if (seenEdgeIds.has(uniqueEdgeId)) return;
      seenEdgeIds.add(uniqueEdgeId);

      edges.push({
        id: uniqueEdgeId,
        source: e.source,
        target: e.target,
        label: e.label || e.relation || "",
        animated: e.animated !== undefined ? e.animated : true,
        style: { stroke: "#38bdf8", strokeWidth: 1.5 },
        labelStyle: { fill: "#94a3b8", fontWeight: 600, fontSize: 10, fontFamily: "monospace" },
        labelBgStyle: { fill: "#0a0f1d", stroke: "#1e293b", rx: 4, ry: 4 },
        labelBgPadding: [6, 4] as [number, number],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#38bdf8",
          width: 14,
          height: 14,
        },
      });
    });

    return edges;
  }, [graphData.edges, flowNodes]);

  return (
    <div className="relative w-full h-[650px] min-h-[550px] bg-[#070b14] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Floating Graph Legend matching reference */}
      <div className="absolute top-4 left-4 z-10 p-3.5 rounded-xl bg-[#0a0f1d]/90 backdrop-blur-md border border-slate-800/80 shadow-2xl space-y-2 text-xs select-none pointer-events-auto">
        <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[11px] uppercase tracking-wider font-mono">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>GRAPH LEGEND</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span>User Accounts</span>
          </div>
          <div className="flex items-center gap-2 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            <span>Processes</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span>Files &amp; Payloads</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            <span>Verified Findings</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800 font-mono">
          Click any node to inspect its raw forensic log record.
        </div>
      </div>

      {/* Main Interactive ReactFlow Canvas */}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.2}
        maxZoom={2.0}
        onNodeClick={(_, node) => onSelectNode && onSelectNode(node.data?.raw || node)}
        style={{ width: "100%", height: "100%" }}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="bg-[#0b101e] border border-slate-800 text-slate-300 rounded-lg shadow-xl [&>button]:border-slate-800 [&>button]:bg-[#0b101e] [&>button]:text-slate-300 hover:[&>button]:bg-slate-800" />
        <MiniMap
          nodeColor={(n) => {
            const t = n.data?.type || n.type || "";
            if (t.includes("user")) return "#10b981";
            if (t.includes("process")) return "#38bdf8";
            if (t.includes("file")) return "#f59e0b";
            return "#a855f7";
          }}
          maskColor="rgba(7, 11, 20, 0.85)"
          className="bg-[#0b101e] border border-slate-800 rounded-lg shadow-xl"
        />
      </ReactFlow>
    </div>
  );
};

export default EvidenceGraph;
