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

export async function resetDemoEnvironment(): Promise<{ success: boolean; case_id?: string; message?: string }> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset demo environment");
  return res.json();
}

export async function purgeAllCases(): Promise<{ success: boolean; message: string; deleted_count: number }> {
  const res = await fetch(`${API_BASE}/cases`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to purge cases");
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

export function getSampleEvidenceDownloadUrl(): string {
  return `${API_BASE}/sample-evidence/download`;
}

export interface SettingsData {
  llm_provider: string;
  nvidia_model: string;
  nvidia_api_key_configured: boolean;
  nvidia_api_key_masked: string;
  gemini_api_key_configured: boolean;
  openai_api_key_configured: boolean;
  max_investigation_steps: number;
  tool_timeout_seconds: number;
}

export async function fetchSettings(): Promise<SettingsData> {
  const res = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(data: Partial<{
  llm_provider: string;
  nvidia_api_key: string;
  nvidia_model: string;
  gemini_api_key: string;
  openai_api_key: string;
  max_investigation_steps: number;
  tool_timeout_seconds: number;
}>): Promise<SettingsData> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function testNvidiaConnection(payload: { api_key?: string; model?: string }): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  status_code?: number;
  model?: string;
  sample_response?: string;
}> {
  const res = await fetch(`${API_BASE}/settings/test-nvidia`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function toggleToolsBridge(): Promise<{ bridge_enabled: boolean; mode: string }> {
  const res = await fetch(`${API_BASE}/tools/toggle-bridge`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to toggle tools bridge");
  return res.json();
}

export interface MLModelItem {
  task: string;
  algorithm: string;
  available: boolean;
  file_path: string | null;
}

export interface MLBenchmark {
  task: string;
  model: string;
  train_accuracy: number;
  test_accuracy: number;
  train_macro_f1: number;
  test_macro_f1: number;
  test_macro_precision: number;
  test_macro_recall: number;
}

export interface MLModelsInfo {
  models: MLModelItem[];
  benchmarks: MLBenchmark[];
  tasks: string[];
  default_scenario_model: string;
  default_triage_model: string;
}

export interface MLPredictRequest {
  hour_of_day: number;
  usb_connected: number;
  bytes_transferred: number;
  failed_logins_24h: number;
  deleted_after_activity: number;
  artifact_type: string;
  action: string;
  file_extension: string;
  external_destination: string;
  scenario?: string;
  scenario_algorithm?: string;
  triage_algorithm?: string;
}

export interface MLPredictResponse {
  scenario: string;
  scenario_confidence: number;
  scenario_probabilities: Record<string, number>;
  flagged: boolean;
  risk_tier: string;
  risk_score: number;
  probability_flagged: number;
  risk_factors: string[];
  algorithms: {
    scenario: string;
    triage: string;
  };
}

export interface MLCaseTriageResponse {
  case_id: string;
  case_name: string;
  total_events: number;
  flagged_count: number;
  case_risk_tier: string;
  average_risk_score: number;
  max_risk_score: number;
  primary_scenario: string;
  scenario_distribution: Record<string, number>;
  ranked_events: Array<{
    event_id: string;
    source_record_id: string;
    timestamp: string;
    event_type: string;
    extracted_features: Record<string, any>;
    scenario: string;
    scenario_confidence: number;
    flagged: boolean;
    risk_tier: string;
    risk_score: number;
    probability_flagged: number;
    risk_factors: string[];
    description: string;
  }>;
}

export async function fetchMLModels(): Promise<MLModelsInfo> {
  const res = await fetch(`${API_BASE}/ml/models`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch ML models info");
  return res.json();
}

export async function predictMLEvent(data: MLPredictRequest): Promise<MLPredictResponse> {
  const res = await fetch(`${API_BASE}/ml/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to execute ML prediction");
  return res.json();
}

export async function triageCaseEvents(
  caseId: string,
  scenarioAlgo: string = "tfidf_logistic_regression",
  triageAlgo: string = "random_forest"
): Promise<MLCaseTriageResponse> {
  const res = await fetch(
    `${API_BASE}/ml/triage-case/${caseId}?scenario_algo=${scenarioAlgo}&triage_algo=${triageAlgo}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to run case ML triage");
  return res.json();
}

