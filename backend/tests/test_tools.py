import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models import Base
from backend.synthetic.cases import seed_synthetic_case
from backend.tools.registry import registry
# Import tools to trigger registration
import backend.tools.inspect_case
import backend.tools.query_events
import backend.tools.trace_process
import backend.tools.build_timeline
import backend.tools.correlate_artifacts
import backend.tools.verify_claim

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_tool_registry_inspect_case(db_session):
    case = seed_synthetic_case(db_session, case_type="complete")
    res = registry.execute_tool(db=db_session, case_id=case.id, tool_name="inspect_case", parameters={})
    assert res.success is True
    assert res.data["case_id"] == case.id
    assert res.data["event_count"] == 9
    assert len(res.data["artifacts"]) == 1

def test_tool_registry_query_events(db_session):
    case = seed_synthetic_case(db_session, case_type="complete")
    res = registry.execute_tool(
        db=db_session,
        case_id=case.id,
        tool_name="query_events",
        parameters={"search_term": "powershell"}
    )
    assert res.success is True
    assert len(res.data["events"]) >= 1

def test_tool_registry_trace_process(db_session):
    case = seed_synthetic_case(db_session, case_type="complete")
    res = registry.execute_tool(db=db_session, case_id=case.id, tool_name="trace_process", parameters={})
    assert res.success is True
    assert "process_tree" in res.data
    assert res.data["total_observed"] >= 3

def test_tool_registry_build_timeline(db_session):
    case = seed_synthetic_case(db_session, case_type="complete")
    res = registry.execute_tool(db=db_session, case_id=case.id, tool_name="build_timeline", parameters={})
    assert res.success is True
    timeline = res.data["timeline"]
    assert len(timeline) == 9
    # Verify chronological ordering
    for i in range(len(timeline) - 1):
        assert timeline[i]["timestamp_utc"] <= timeline[i + 1]["timestamp_utc"]

def test_tool_registry_correlate_artifacts(db_session):
    case = seed_synthetic_case(db_session, case_type="complete")
    res = registry.execute_tool(db=db_session, case_id=case.id, tool_name="correlate_artifacts", parameters={})
    assert res.success is True
    assert res.data["relationships_created"] > 0
