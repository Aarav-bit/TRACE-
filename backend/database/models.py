import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    Index,
    Boolean,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

def gen_uuid():
    return str(uuid.uuid4())

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    objective = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, completed, archived
    is_demo = Column(Boolean, default=False)
    demo_type = Column(String(50), nullable=True)  # 'complete', 'degraded'
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    artifacts = relationship("Artifact", back_populates="case", cascade="all, delete-orphan")
    events = relationship("EvidenceEvent", back_populates="case", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="case", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="case", cascade="all, delete-orphan")
    relationships = relationship("EvidenceRelationship", back_populates="case", cascade="all, delete-orphan")
    audit_entries = relationship("AuditEntry", back_populates="case", cascade="all, delete-orphan")


class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    artifact_type = Column(String(50), nullable=False)  # evtx, json, csv, zip, etc.
    file_size = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=False, index=True)
    original_storage_reference = Column(String(512), nullable=False)
    parser_name = Column(String(100), nullable=False)
    parser_status = Column(String(50), nullable=False)  # parsed, parsed_with_warnings, failed
    record_count = Column(Integer, default=0)
    warnings = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    case = relationship("Case", back_populates="artifacts")
    events = relationship("EvidenceEvent", back_populates="artifact", cascade="all, delete-orphan")


class EvidenceEvent(Base):
    __tablename__ = "evidence_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    artifact_id = Column(String(36), ForeignKey("artifacts.id", ondelete="CASCADE"), nullable=False, index=True)
    source_record_id = Column(String(128), nullable=False, index=True)
    timestamp_utc = Column(DateTime(timezone=True), nullable=False, index=True)
    original_timestamp = Column(String(128), nullable=False)
    timezone_metadata = Column(String(64), default="UTC")
    event_type = Column(String(100), nullable=False, index=True)  # process_creation, logon, file_write, network, etc.
    normalized_fields_json = Column(Text, nullable=False, default="{}")
    source_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    case = relationship("Case", back_populates="events")
    artifact = relationship("Artifact", back_populates="events")
    finding_links = relationship("FindingEvidence", back_populates="evidence_event", cascade="all, delete-orphan")

    @property
    def normalized_fields(self):
        try:
            return json.loads(self.normalized_fields_json) if self.normalized_fields_json else {}
        except Exception:
            return {}

    @normalized_fields.setter
    def normalized_fields(self, val):
        self.normalized_fields_json = json.dumps(val) if val is not None else "{}"


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, running, paused, completed, stopped, failed
    objective = Column(Text, nullable=False)
    current_hypothesis = Column(Text, nullable=True)
    mode = Column(String(50), default="deterministic")  # deterministic, ai
    state_json = Column(Text, default="{}")
    steps_used = Column(Integer, default=0)
    max_steps = Column(Integer, default=12)
    termination_reason = Column(Text, nullable=True)
    simulated_failure = Column(String(100), nullable=True)  # Demo failure injection trigger
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    case = relationship("Case", back_populates="investigations")
    actions = relationship("InvestigationAction", back_populates="investigation", cascade="all, delete-orphan", order_by="InvestigationAction.sequence_number")
    findings = relationship("Finding", back_populates="investigation", cascade="all, delete-orphan")


class InvestigationAction(Base):
    __tablename__ = "investigation_actions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence_number = Column(Integer, nullable=False)
    tool_name = Column(String(100), nullable=False)
    action_type = Column(String(100), default="tool_execution")
    rationale = Column(Text, nullable=True)
    validated_inputs_json = Column(Text, default="{}")
    status = Column(String(50), default="planned")  # planned, running, completed, failed, retrying, replanned, awaiting_verification, blocked
    result_summary = Column(Text, nullable=True)
    structured_result_json = Column(Text, default="{}")
    error_details = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), default=get_utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    investigation = relationship("Investigation", back_populates="actions")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    claim = Column(Text, nullable=False)
    status = Column(String(50), default="unresolved", nullable=False)  # supported, contradicted, unresolved
    confidence_assessment = Column(String(100), default="Medium")
    verification_method = Column(String(100), default="deterministic_provenance_check")
    verification_details_json = Column(Text, default="{}")
    uncertainty_notes = Column(Text, nullable=True)
    suggested_next_action = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    case = relationship("Case", back_populates="findings")
    investigation = relationship("Investigation", back_populates="findings")
    evidence_links = relationship("FindingEvidence", back_populates="finding", cascade="all, delete-orphan")


class FindingEvidence(Base):
    __tablename__ = "finding_evidence"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    finding_id = Column(String(36), ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_event_id = Column(String(36), ForeignKey("evidence_events.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(50), default="supports")  # supports, contradicts, contextual
    explanation = Column(Text, nullable=True)

    finding = relationship("Finding", back_populates="evidence_links")
    evidence_event = relationship("EvidenceEvent", back_populates="finding_links")


class EvidenceRelationship(Base):
    __tablename__ = "evidence_relationships"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    source_entity_id = Column(String(255), nullable=False, index=True)
    target_entity_id = Column(String(255), nullable=False, index=True)
    relationship_type = Column(String(100), nullable=False)  # spawned, executed_as, created, modified, temporally_correlated, corroborates, contradicts
    relationship_class = Column(String(50), default="observed")  # observed, inferred, ambiguous
    evidence_ids_json = Column(Text, default="[]")
    matching_criteria = Column(Text, nullable=True)
    verification_status = Column(String(50), default="verified")  # verified, unverified, disputed
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    case = relationship("Case", back_populates="relationships")


class AuditEntry(Base):
    __tablename__ = "audit_entries"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence_number = Column(Integer, nullable=False)
    event_type = Column(String(100), nullable=False)
    event_data_json = Column(Text, default="{}")
    previous_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    case = relationship("Case", back_populates="audit_entries")


# Indexes for optimal querying
Index("idx_ev_case_ts", EvidenceEvent.case_id, EvidenceEvent.timestamp_utc)
Index("idx_ev_case_type", EvidenceEvent.case_id, EvidenceEvent.event_type)
Index("idx_act_inv_seq", InvestigationAction.investigation_id, InvestigationAction.sequence_number)
