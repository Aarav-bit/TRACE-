import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models import Base, Case, EvidenceEvent, Artifact
from backend.synthetic.cases import seed_synthetic_case
from backend.verification.verifier import verify_finding

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_verifier_supported_claim(db_session):
    case = seed_synthetic_case(db_session, case_type="complete")
    events = db_session.query(EvidenceEvent).filter(EvidenceEvent.case_id == case.id).all()
    ps_ev = [ev for ev in events if ev.normalized_fields.get("process_name") == "powershell.exe"][0]

    result = verify_finding(
        db=db_session,
        case_id=case.id,
        claim_title="PowerShell Execution Observed",
        claim_text="PowerShell was executed on workstation",
        supporting_evidence_ids=[ps_ev.id],
        required_keywords=["powershell"],
    )

    assert result.status == "supported"
    assert result.is_verified is True
    assert len(result.verified_evidence_ids) == 1

def test_verifier_rejects_fake_evidence_ids(db_session):
    case = seed_synthetic_case(db_session, case_type="complete")

    result = verify_finding(
        db=db_session,
        case_id=case.id,
        claim_title="Fabricated Claim",
        claim_text="Attacker performed lateral movement",
        supporting_evidence_ids=["fake-uuid-12345"],
    )

    assert result.status == "unresolved"
    assert result.is_verified is False
    assert any("do not exist" in r for r in result.reasons)

def test_verifier_detects_contradictions(db_session):
    case = seed_synthetic_case(db_session, case_type="complete")
    events = db_session.query(EvidenceEvent).filter(EvidenceEvent.case_id == case.id).all()

    result = verify_finding(
        db=db_session,
        case_id=case.id,
        claim_title="User NEVER logged in",
        claim_text="There was no interactive logon",
        supporting_evidence_ids=[events[1].id],
        contradictory_evidence_ids=[events[0].id],  # Event 0 is 4624 user_logon
    )

    assert result.status == "contradicted"
    assert result.is_verified is False

def test_verifier_degraded_evidence_unresolved(db_session):
    # In degraded case, child process execution record REC-00106 is removed
    case = seed_synthetic_case(db_session, case_type="degraded")
    events = db_session.query(EvidenceEvent).filter(EvidenceEvent.case_id == case.id).all()
    all_ids = [ev.id for ev in events]

    result = verify_finding(
        db=db_session,
        case_id=case.id,
        claim_title="PowerShell Directly Spawned scvhost.exe",
        claim_text="powershell executed scvhost as an interactive child process",
        supporting_evidence_ids=all_ids,
    )

    # Must be marked unresolved because direct process execution record was omitted!
    assert result.status == "unresolved"
    assert "missing" in result.uncertainty_notes.lower()
