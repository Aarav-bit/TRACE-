from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.models import Base
from backend.synthetic.cases import seed_synthetic_case
from backend.tools.registry import registry
import backend.tools


def test_registry_rejects_unknown_tool_without_execution():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    case = seed_synthetic_case(session, case_type="complete")

    result = registry.execute_tool(session, case.id, "arbitrary_shell", {"command": "whoami"})

    assert result.success is False
    assert "approved security tool registry" in result.error


def test_registry_rejects_unknown_arguments_before_handler_execution():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    case = seed_synthetic_case(session, case_type="complete")

    result = registry.execute_tool(
        session,
        case.id,
        "query_events",
        {"search_term": "powershell", "command": "cmd.exe /c whoami"},
    )

    assert result.success is False
    assert "Unsupported argument" in result.error


def test_hash_tool_verifies_synthetic_artifact():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    case = seed_synthetic_case(session, case_type="complete")
    artifact_id = case.artifacts[0].id

    result = registry.execute_tool(session, case.id, "calculate_sha256", {"artifact_id": artifact_id})

    assert result.success is True
    assert result.data["integrity_status"] == "verified"
