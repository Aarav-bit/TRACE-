import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models import Base, Case, Investigation, InvestigationAction
from backend.synthetic.cases import seed_synthetic_case
from backend.agent.engine import run_investigation_loop, coordinator
from backend.agent.planner_deterministic import DeterministicPlanner
from backend.agent.state import InvestigationState
from backend.tools.registry import ToolExecutionResult

def test_deterministic_planner_adaptation():
    planner = DeterministicPlanner()
    state = InvestigationState(case_id="test", investigation_id="inv1", objective="test objective")

    # Step 0: Initial plan is inspect_case
    act0 = planner.decide_next_action(state)
    assert act0["tool_name"] == "inspect_case"

    # Step 1: Targeted query
    state.completed_steps = 1
    act1 = planner.decide_next_action(state)
    assert act1["tool_name"] == "query_events"

    # Simulated failure on step 1: Planner should retry idempotently
    mock_failed_result = ToolExecutionResult(
        success=False,
        summary="Query timeout",
        data={},
        error="Connection reset by peer",
    )
    retry_act = planner.decide_next_action(state, last_result=mock_failed_result, last_tool_name="query_events")
    assert retry_act["action_type"] == "retry"
    assert state.retry_count == 1

    # Second retry failure: Planner should replan using fallback tool
    retry2_act = planner.decide_next_action(state, last_result=mock_failed_result, last_tool_name="query_events")
    assert retry2_act["action_type"] == "retry"

    # Third failure exceeds retry budget: Replans to build_timeline fallback!
    replan_act = planner.decide_next_action(state, last_result=mock_failed_result, last_tool_name="query_events")
    assert replan_act["action_type"] == "replanned_fallback"
    assert replan_act["tool_name"] == "build_timeline"
    assert len(state.failure_history) == 1

def test_investigation_run_and_complete():
    # Use real SQLite database
    from backend.database.session import SessionLocal
    db = SessionLocal()
    case = seed_synthetic_case(db, case_type="complete")

    inv = Investigation(
        case_id=case.id,
        status="pending",
        objective=case.objective,
        mode="deterministic",
        max_steps=8,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    # Run loop synchronously
    run_investigation_loop(inv.id)

    db.refresh(inv)
    assert inv.status == "completed"
    assert inv.steps_used > 0
    assert inv.completed_at is not None

    actions = db.query(InvestigationAction).filter(InvestigationAction.investigation_id == inv.id).all()
    assert len(actions) >= 5
    db.close()
