import {
  Case,
  Artifact,
  EvidenceEvent,
  Investigation,
  Finding,
  ProcessTreeData,
  ToolStatusItem,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchCases(): Promise<Case[]> {
  const res = await fetch(`${API_BASE}/cases`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function fetchCase(id: string): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch case");
  return res.json();
}

export async function createCase(payload: {
  name: string;
  objective: string;
  description?: string;
  is_demo?: boolean;
}): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create case");
  return res.json();
}

export async function seedDemoCase(caseType: "complete" | "degraded"): Promise<{ success: boolean; case_id: string; name: string }> {
  const res = await fetch(`${API_BASE}/demo/seed?case_type=${caseType}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to seed demo case");
  return res.json();
}

export async function resetDemoEnvironment(): Promise<{ success: boolean; case_id: string }> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset demo environment");
  return res.json();
}

export async function uploadArtifacts(caseId: string, files: File[]): Promise<Artifact[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${API_BASE}/cases/${caseId}/artifacts`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function fetchArtifacts(caseId: string): Promise<Artifact[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/artifacts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch artifacts");
  return res.json();
}

export async function startInvestigation(
  caseId: string,
  options?: { objective?: string; mode?: "deterministic" | "ai"; max_steps?: number }
): Promise<Investigation> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/investigations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options || {}),
  });
  if (!res.ok) throw new Error("Failed to start investigation");
  return res.json();
}

export async function fetchInvestigation(investigationId: string): Promise<Investigation> {
  const res = await fetch(`${API_BASE}/investigations/${investigationId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch investigation");
  return res.json();
}

export async function pauseInvestigation(id: string): Promise<void> {
  await fetch(`${API_BASE}/investigations/${id}/pause`, { method: "POST" });
}

export async function resumeInvestigation(id: string): Promise<void> {
  await fetch(`${API_BASE}/investigations/${id}/resume`, { method: "POST" });
}

export async function stopInvestigation(id: string): Promise<void> {
  await fetch(`${API_BASE}/investigations/${id}/stop`, { method: "POST" });
}

export async function injectFailure(id: string, failureType: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/investigations/${id}/fail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ failure_type: failureType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failure injection failed" }));
    throw new Error(err.detail || "Failure injection failed");
  }
  return res.json();
}

export async function fetchTimeline(
  caseId: string,
  filters?: { event_type?: string; user?: string; search?: string }
): Promise<EvidenceEvent[]> {
  const params = new URLSearchParams();
  if (filters?.event_type) params.append("event_type", filters.event_type);
  if (filters?.user) params.append("user", filters.user);
  if (filters?.search) params.append("search", filters.search);

  const res = await fetch(`${API_BASE}/cases/${caseId}/timeline?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

export async function fetchFindings(caseId: string): Promise<Finding[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/findings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch findings");
  return res.json();
}

export async function fetchEvidenceEvent(caseId: string, evidenceId: string): Promise<EvidenceEvent> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/evidence/${evidenceId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch evidence record");
  return res.json();
}

export async function fetchProcessTree(caseId: string): Promise<ProcessTreeData> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/process_tree`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch process tree");
  return res.json();
}

export async function fetchEvidenceGraph(caseId: string): Promise<{ nodes: any[]; edges: any[] }> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/graph`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch evidence graph");
  return res.json();
}

export async function fetchToolsStatus(): Promise<ToolStatusItem[]> {
  const res = await fetch(`${API_BASE}/tools/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tools status");
  return res.json();
}

export async function fetchReportMarkdown(caseId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/report`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch report markdown");
  return res.text();
}

export function getReportHtmlUrl(caseId: string): string {
  return `${API_BASE}/cases/${caseId}/report/html`;
}

export function getInvestigationEventsUrl(investigationId: string): string {
  return `${API_BASE}/investigations/${investigationId}/events`;
}
