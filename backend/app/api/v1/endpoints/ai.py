from datetime import datetime, time, timedelta
import json
import os
import random
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.db import models
from app.db.models import Shift, User
from app.models.ai_scoring import OPEN_SHIFT_MODE_RECOMMEND_ONLY
from app.schemas.ai import (
    AIAssignApplyRequest,
    AIAssignApplyResponse,
    AIAssignPreviewRequest,
    AIAssignPreviewResponse,
    AIAssignmentApplied,
    AIAssignmentRejected,
    AIFairnessSummaryItem,
    AIScoringConfigRead,
    AIResponse,
    AIShiftSuggestion,
    AIUnfilledShift,
    ScheduleRequest,
    SuggestedShift,
)
from app.services.ai_scoring_service import (
    analyze_feedback,
    build_fairness_summary,
    capture_feedback,
    create_assignment_audit_log,
    get_or_default_contract_rule,
    get_or_default_scoring_config,
    get_or_default_tenant_settings,
    hard_constraint_filter,
    score_candidates,
)

router = APIRouter()


def _resolve_tenant_id(
    current_user: models.User,
    explicit_tenant_id: Optional[int] = None,
) -> int:
    if current_user.role == "superadmin":
        if explicit_tenant_id is not None:
            return explicit_tenant_id
        if current_user.company_id is not None:
            return current_user.company_id
        raise HTTPException(
            status_code=400,
            detail="tenant_id is required for superadmin requests",
        )

    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Admin has no company association")
    return current_user.company_id


def _scoring_config_to_schema(config: Any) -> AIScoringConfigRead:
    return AIScoringConfigRead(
        id=config.id,
        tenant_id=config.tenant_id,
        availability_weight=float(config.availability_weight),
        skill_match_weight=float(config.skill_match_weight),
        hours_balance_weight=float(config.hours_balance_weight),
        rest_margin_weight=float(config.rest_margin_weight),
        weekend_balance_weight=float(config.weekend_balance_weight),
        night_balance_weight=float(config.night_balance_weight),
        preference_weight=float(config.preference_weight),
        min_score_threshold=(
            float(config.min_score_threshold)
            if config.min_score_threshold is not None
            else None
        ),
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


def _aggregate_rejection_reasons(rejected_map: Dict[int, List[str]]) -> List[str]:
    reasons = sorted({reason for reasons in rejected_map.values() for reason in reasons})
    return reasons or ["NO_ELIGIBLE_CANDIDATES"]


def generate_mock_schedule(users: Any, request: ScheduleRequest) -> AIResponse:
    shifts = []
    current_date = request.start_date
    delta = timedelta(days=1)

    if not isinstance(users, list):
        users = list(users)

    if not users:
        return AIResponse(shifts=[], explanation="No users available")

    while current_date <= request.end_date:
        day_staff = random.sample(users, min(len(users), 2))
        for i, emp in enumerate(day_staff):
            is_morning = i == 0
            start_hour = 8 if is_morning else 14
            end_hour = 16 if is_morning else 22

            s_time = datetime.combine(current_date.date(), datetime.min.time()).replace(
                hour=start_hour
            )
            e_time = datetime.combine(current_date.date(), datetime.min.time()).replace(
                hour=end_hour
            )

            shifts.append(
                SuggestedShift(
                    employee_id=emp.id,
                    employee_name=emp.full_name,
                    start_time=s_time,
                    end_time=e_time,
                    role=emp.role if emp.role else "Employee",
                    reason="Mock AI: Random assignment based on availability",
                )
            )
        current_date += delta

    return AIResponse(
        shifts=shifts,
        explanation="Generated using heuristic fallback (AI Service Unavailable).",
    )


@router.post("/suggest_schedule", response_model=AIResponse)
def suggest_schedule(
    request: ScheduleRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    if current_user.role == "superadmin":
        if not request.company_id:
            raise HTTPException(
                status_code=400,
                detail="company_id is required for superadmin requests",
            )
        company_id = request.company_id
    else:
        if not current_user.company_id:
            raise HTTPException(status_code=403, detail="Admin has no company association")
        company_id = current_user.company_id

    users = (
        db.query(models.User)
        .filter(
            models.User.is_active == True,
            models.User.company_id == company_id,
            models.User.role == "employee",
        )
        .all()
    )
    if not users:
        raise HTTPException(status_code=400, detail="No active employees found")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return generate_mock_schedule(users, request)

    try:
        from langchain.chat_models import ChatOpenAI
        from langchain.schema import HumanMessage, SystemMessage

        chat = ChatOpenAI(
            temperature=0,
            openai_api_key=api_key,
            model_name="gpt-3.5-turbo",
        )
        employee_data = [f"ID: {u.id}, Name: {u.full_name}, Role: {u.role}" for u in users]

        prompt = f"""
        You are an expert rota scheduler.
        Generate a shift schedule from {request.start_date} to {request.end_date}.

        Employees:
        {json.dumps(employee_data)}

        Constraints:
        - 2 shifts per day: 08:00-16:00 and 14:00-22:00.
        - Ensure fair distribution.

        Return JSON format ONLY:
        {{
            "shifts": [
                {{
                    "employee_id": 1,
                    "employee_name": "John Doe",
                    "start_time": "YYYY-MM-DDTHH:MM:SS",
                    "end_time": "YYYY-MM-DDTHH:MM:SS",
                    "role": "Nurse",
                    "reason": "Expertise match"
                }}
            ],
            "explanation": "Brief summary of strategy"
        }}
        """

        messages = [
            SystemMessage(
                content="You are a helpful scheduling assistant. Output valid JSON."
            ),
            HumanMessage(content=prompt),
        ]

        response = chat(messages)
        content = response.content
        try:
            data = json.loads(content)
            return AIResponse(**data)
        except Exception:
            return generate_mock_schedule(users, request)
    except Exception:
        return generate_mock_schedule(users, request)


@router.post("/assign/preview", response_model=AIAssignPreviewResponse)
def preview_assignments(
    *,
    request: AIAssignPreviewRequest,
    tenant_id: Optional[int] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    scoped_tenant_id = _resolve_tenant_id(current_user, explicit_tenant_id=tenant_id)

    week_start_dt = datetime.combine(request.week_start, time.min)
    week_end_dt = week_start_dt + timedelta(days=7)

    all_week_shifts = (
        db.query(Shift)
        .filter(
            Shift.company_id == scoped_tenant_id,
            Shift.start_time < week_end_dt,
            Shift.end_time > week_start_dt,
        )
        .order_by(Shift.start_time.asc(), Shift.id.asc())
        .all()
    )

    unassigned_shifts = [
        shift
        for shift in all_week_shifts
        if shift.employee_id is None and str(shift.status or "").lower() != "open"
    ]
    open_shifts = [
        shift
        for shift in all_week_shifts
        if shift.employee_id is None and str(shift.status or "").lower() == "open"
    ]

    target_shifts = list(unassigned_shifts)
    if request.include_open_shifts:
        target_shifts.extend(open_shifts)
    target_shifts.sort(key=lambda row: (row.start_time, row.id))

    employees = (
        db.query(User)
        .filter(
            User.company_id == scoped_tenant_id,
            User.role == "employee",
            User.is_active == True,
        )
        .order_by(User.id.asc())
        .all()
    )

    scoring_config = get_or_default_scoring_config(
        db,
        scoped_tenant_id,
        create_if_missing=True,
    )
    contract_rule = get_or_default_contract_rule(db, scoped_tenant_id)
    tenant_settings = get_or_default_tenant_settings(db, scoped_tenant_id)

    shift_suggestions: List[AIShiftSuggestion] = []
    unfilled: List[AIUnfilledShift] = []
    raw_suggestions: List[Dict[str, Any]] = []

    for shift in target_shifts:
        notes: List[str] = []
        if (
            str(shift.status or "").lower() == "open"
            and str(tenant_settings.open_shift_mode).upper()
            == OPEN_SHIFT_MODE_RECOMMEND_ONLY
        ):
            notes.append("OPEN_SHIFT_RECOMMEND_ONLY")

        eligible_candidates, rejected_map = hard_constraint_filter(
            db,
            shift=shift,
            employees=employees,
            tenant_id=scoped_tenant_id,
            contract_rule=contract_rule,
            tenant_settings=tenant_settings,
        )
        scored_candidates = score_candidates(shift, eligible_candidates, scoring_config)

        recommended_employee_id: Optional[int] = None
        recommended_score: Optional[float] = None
        if scored_candidates:
            top = scored_candidates[0]
            recommended_employee_id = int(top["employee_id"])
            recommended_score = float(top["total_score"])
        else:
            unfilled.append(
                AIUnfilledShift(
                    shift_id=shift.id,
                    reasons=_aggregate_rejection_reasons(rejected_map),
                )
            )

        suggestion = AIShiftSuggestion(
            shift_id=shift.id,
            recommended_employee_id=recommended_employee_id,
            recommended_score=recommended_score,
            candidates=scored_candidates,
            notes=notes,
        )
        shift_suggestions.append(suggestion)
        raw_suggestions.append(
            suggestion.model_dump() if hasattr(suggestion, "model_dump") else suggestion.dict()
        )

    employee_map = {employee.id: employee for employee in employees}
    shift_map = {shift.id: shift for shift in all_week_shifts}
    fairness_rows = build_fairness_summary(raw_suggestions, shift_map, employee_map)

    return AIAssignPreviewResponse(
        week_start=request.week_start,
        scoring_config_used=_scoring_config_to_schema(scoring_config),
        shift_suggestions=shift_suggestions,
        unfilled_shifts=unfilled,
        fairness_summary=[AIFairnessSummaryItem(**row) for row in fairness_rows],
    )


@router.post("/assign/apply", response_model=AIAssignApplyResponse)
def apply_assignments(
    *,
    request: AIAssignApplyRequest,
    tenant_id: Optional[int] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    if (request.apply_target or "").upper() != "DRAFT":
        raise HTTPException(status_code=400, detail="Only apply_target=DRAFT is supported")

    scoped_tenant_id = _resolve_tenant_id(current_user, explicit_tenant_id=tenant_id)
    week_start_dt = datetime.combine(request.week_start, time.min)
    week_end_dt = week_start_dt + timedelta(days=7)
    employees_by_id = {
        employee.id: employee
        for employee in (
            db.query(User)
            .filter(
                User.company_id == scoped_tenant_id,
                User.role == "employee",
                User.is_active == True,
            )
            .all()
        )
    }

    contract_rule = get_or_default_contract_rule(db, scoped_tenant_id)
    tenant_settings = get_or_default_tenant_settings(db, scoped_tenant_id)

    applied: List[AIAssignmentApplied] = []
    rejected: List[AIAssignmentRejected] = []

    for item in request.assignments:
        shift = (
            db.query(Shift)
            .filter(
                Shift.id == item.shift_id,
                Shift.company_id == scoped_tenant_id,
            )
            .first()
        )
        if not shift:
            rejected.append(
                AIAssignmentRejected(
                    shift_id=item.shift_id,
                    employee_id=item.employee_id,
                    reasons=["SHIFT_NOT_FOUND"],
                )
            )
            continue

        if shift.end_time <= week_start_dt or shift.start_time >= week_end_dt:
            rejected.append(
                AIAssignmentRejected(
                    shift_id=item.shift_id,
                    employee_id=item.employee_id,
                    reasons=["SHIFT_OUTSIDE_TARGET_WEEK"],
                )
            )
            continue

        employee = employees_by_id.get(item.employee_id)
        if employee is None:
            rejected.append(
                AIAssignmentRejected(
                    shift_id=item.shift_id,
                    employee_id=item.employee_id,
                    reasons=["EMPLOYEE_NOT_FOUND"],
                )
            )
            continue

        eligible, rejected_map = hard_constraint_filter(
            db,
            shift=shift,
            employees=[employee],
            tenant_id=scoped_tenant_id,
            contract_rule=contract_rule,
            tenant_settings=tenant_settings,
        )
        if not eligible:
            rejected.append(
                AIAssignmentRejected(
                    shift_id=item.shift_id,
                    employee_id=item.employee_id,
                    reasons=_aggregate_rejection_reasons(rejected_map),
                )
            )
            continue

        # --- Feedback Capture Logic ---
        # 1. Score all eligible candidates for this shift to find who AI *would* have picked.
        #    (We need to fetch all employees again to do this properly, or at least enough to know top rank)
        #    Optimization: For now, we'll fetch all active employees for the tenant.
        #    In a high-scale scenario, we might want to optimize this or trust the frontend to send "original_suggestion".
        #    But for reliability, backend recalculation is safer.
        all_employees = (
            db.query(models.User)
            .filter(
                models.User.company_id == scoped_tenant_id,
                models.User.role == "employee",
                models.User.is_active == True,
            )
            .all()
        )
        
        # We need scoring config
        scoring_config = get_or_default_scoring_config(db, scoped_tenant_id, create_if_missing=True)
        
        # Filter and score all
        all_eligible, _ = hard_constraint_filter(
            db,
            shift=shift,
            employees=all_employees,
            tenant_id=scoped_tenant_id,
            contract_rule=contract_rule,
            tenant_settings=tenant_settings,
        )
        scored_all = score_candidates(shift, all_eligible, scoring_config)
        
        original_employee_id = None
        if scored_all:
            original_employee_id = int(scored_all[0]["employee_id"])

        if original_employee_id and original_employee_id != employee.id:
            # The user picked someone who is NOT the top AI choice.
            capture_feedback(
                db,
                tenant_id=scoped_tenant_id,
                shift_id=shift.id,
                original_employee_id=original_employee_id,
                final_employee_id=employee.id,
                reason="MANUAL_OVERRIDE",
            )
        # -----------------------------

        shift.employee_id = employee.id
        shift.status = "draft"
        db.add(shift)
        create_assignment_audit_log(
            db,
            tenant_id=scoped_tenant_id,
            shift_id=shift.id,
            employee_id=employee.id,
            created_by_user_id=current_user.id,
            details=f"week_start={request.week_start.isoformat()}",
        )
        db.flush()
        applied.append(AIAssignmentApplied(shift_id=shift.id, employee_id=employee.id))

    db.commit()
    return AIAssignApplyResponse(applied=applied, rejected=rejected)


@router.get("/scoring/optimization", response_model=Dict[str, Any])
def get_scoring_optimization(
    tenant_id: Optional[int] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    scoped_tenant_id = _resolve_tenant_id(current_user, explicit_tenant_id=tenant_id)
    analysis = analyze_feedback(db, scoped_tenant_id)
    return analysis


@router.post("/seed-demo", status_code=201)
def run_seed_demo_data(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Seed AI Demo Data (Employees, Shifts, History).
    """
    try:
        results = seed_ai_demo(db)
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
