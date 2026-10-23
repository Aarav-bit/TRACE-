export interface Case {
  id: string;
  name: string;
  objective: string;
  description?: string;
  status: string;
  is_demo: boolean;
  demo_type?: string;
  created_at: string;
  updated_at: string;
  artifact_count: number;
  finding_count: number;
  event_count: number;
  last_activity?: string;
}

export interface Artifact {
  id: string;
  case_id: string;
  original_filename: string;
  artifact_type: string;
  file_size: number;
  sha256: string;
  parser_name: string;
  parser_status: string;
  record_count: number;
  warnings?: string;
  created_at: string;
}

export interface EvidenceEvent {
  id: string;
  case_id: string;
  artifact_id: string;
  source_record_id: string;
  timestamp_utc: string;
  original_timestamp: string;
  timezone_metadata: string;
  event_type: string;
  normalized_fields: {
    event_id?: string;
    process_name?: string;
    pid?: string;
    parent_process_name?: string;
    ppid?: string;
    command_line?: string;
    user?: string;
    file_path?: string;
    target_file?: string;
    source_ip?: string;
    dest_ip?: string;
    dest_port?: string;
    description?: string;
    raw_attributes?: Record<string, any>;
  };
  source_hash: string;
  created_at: string;
}

export interface InvestigationAction {
  id: string;
  investigation_id: string;
  sequence_number: number;
  tool_name: string;
  action_type: string;
  rationale?: string;
  validated_inputs: Record<string, any>;
  status: "planned" | "running" | "completed" | "failed" | "retrying" | "replanned" | "awaiting_verification" | "blocked";
  result_summary?: string;
  structured_result?: Record<string, any>;
  error_details?: string;
  retry_count: number;
  started_at: string;
  completed_at?: string;
}

export interface Investigation {
  id: string;
  case_id: string;
  status: "pending" | "running" | "paused" | "completed" | "stopped" | "failed";
  objective: string;
  current_hypothesis?: string;
  mode: "deterministic" | "ai";
  steps_used: number;
  max_steps: number;
  termination_reason?: string;
  simulated_failure?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  actions: InvestigationAction[];
}

export interface FindingEvidenceLink {
  evidence_event_id: string;
  relationship_type: string;
  explanation?: string;
  source_record_id?: string;
  event_type?: string;
  timestamp_utc?: string;
}

export interface Finding {
  id: string;
  case_id: string;
  investigation_id?: string;
  title: string;
  claim: string;
  status: "supported" | "contradicted" | "unresolved";
  confidence_assessment: string;
  verification_method: string;
  verification_details: Record<string, any>;
  uncertainty_notes?: string;
  suggested_next_action?: string;
  created_at: string;
  updated_at: string;
  evidence_links: FindingEvidenceLink[];
}

export interface ProcessNode {
  pid: string;
  ppid: string;
  name: string;
  parent_name: string;
  command_line: string;
  user: string;
  timestamp_utc: string;
  relationship_class: "observed" | "inferred" | "missing_parent_record";
  children?: ProcessNode[];
  evidence_id?: string;
}

export interface ProcessTreeData {
  process_tree: ProcessNode[];
  all_processes: ProcessNode[];
  missing_parents: Array<{
    child_pid: string;
    child_name: string;
    missing_parent_pid: string;
    missing_parent_name: string;
  }>;
  unanchored_executions: Array<{
    pid: string;
    name: string;
    relationship_class: string;
    reason: string;
    evidence_id: string;
    source_record_id: string;
  }>;
  total_observed: number;
}

export interface ToolStatusItem {
  name: string;
  display_name: string;
  category: string;
  installed: boolean;
  version?: string;
  supported_operations: string[];
  last_health_check: string;
  configuration_guidance: string;
}
