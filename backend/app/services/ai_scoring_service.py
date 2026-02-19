from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.db.models import Availability, Shift, TimeOffRequest, User
from app.models.ai_scoring import (
    AIFeedbackLoop,
    AIScoringConfig,
    AssignmentAuditLog,
    ContractRule,
    EmployeePreference,
    OPEN_SHIFT_MODE_AUTO_ASSIGN,
    OPEN_SHIFT_MODE_RECOMMEND_ONLY,
    TenantSchedulingSettings,
)

def capture_feedback(
    db: Session,
    *,
    tenant_id: int,
    shift_id: int,
    original_employee_id: Optional[int],
    final_employee_id: int,
    reason: Optional[str] = None,
) -> AIFeedbackLoop:
    if original_employee_id == final_employee_id:
        return None

    feedback = AIFeedbackLoop(
        tenant_id=tenant_id,
        shift_id=shift_id,
        original_employee_id=original_employee_id,
        final_employee_id=final_employee_id,
        change_reason=reason,
        created_at=datetime.utcnow(),
    )
    db.add(feedback)
    return feedback


def analyze_feedback(
    db: Session,
    tenant_id: int,
) -> Dict[str, Any]:
    """
    Analyzes feedback for the given tenant and suggests weight adjustments.
    """
    # 1. Fetch recent feedback (last 30 days)
    cutoff = datetime.utcnow() - timedelta(days=30)
    feedbacks = (
        db.query(AIFeedbackLoop)
        .filter(
            AIFeedbackLoop.tenant_id == tenant_id,
            AIFeedbackLoop.created_at >= cutoff,
        )
        .all()
    )

    if not feedbacks:
        return {"suggestion": "No sufficient data to optimize weights."}

    # 2. Heuristic Analysis
    # We want to see if the 'final_employee' systematically had better scores in specific categories
    # than the 'original_employee' (if original_employee was recorded).
    # Since we don't store the snapshot of scores at that time, we'll use a simplified heuristic:
    # "If many users are overriding, maybe 'Employee Preference' or 'Skill Match' is more important."
    
    # Simple counting for now (Phase B MVP)
    override_count = len(feedbacks)
    
    # In a real ML system, we would replay the scoring and see which feature diff correlates with the choice.
    # For this "Lightweight" version, we'll return a static suggestion if overrides are high.
    
    suggestion_text = f"Analyzed {override_count} overrides in the last 30 days."
    suggested_changes = {}

    if override_count > 5:
        # Dummy logic: If overrides are frequent, suggest relying more on 'Skill Match' and 'Preferences'.
        suggestion_text += " High override rate detected. Suggesting increased weight for attributes associated with manual selection."
        current_config = get_or_default_scoring_config(db, tenant_id, create_if_missing=True)
        
        suggested_changes = {
            "skill_match_weight": min(100.0, current_config.skill_match_weight + 5.0),
            "preference_weight": min(100.0, current_config.preference_weight + 5.0),
            "reason": "Frequent manual overrides suggest current model underestimates skills or preferences."
        }
    else:
        suggestion_text += " Model performance is stable."

    return {
        "analysis_period_days": 30,
        "total_overrides": override_count,
        "suggestion_text": suggestion_text,
        "suggested_weight_changes": suggested_changes
    }

DEFAULT_MIN_REST_HOURS = 11.0
DEFAULT_MAX_HOURS_DAY = 12.0
DEFAULT_MAX_HOURS_WEEK = 48.0

AVAILABILITY_AVAILABLE = "AVAILABLE"
AVAILABILITY_PREFER_NOT = "PREFER_NOT"
AVAILABILITY_UNAVAILABLE = "UNAVAILABLE"

SKILL_EXACT = "exact"
SKILL_SECONDARY = "secondary"


@dataclass
class CandidateContext:
    employee: User
    availability_state: str
    skill_level: str
    weekly_hours: float
    rest_margin_hours: float
    weekend_count_last_4_weeks: int
    night_count_last_4_weeks: int
    preference_match: bool
    flags: List[str]


def _normalize(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def _is_open_shift(shift: Shift) -> bool:
    return _normalize(shift.status) == "open"


def _is_night_shift(shift: Shift) -> bool:
    if shift.start_time.hour >= 22 or shift.start_time.hour < 6:
        return True
    return shift.end_time.hour <= 6 and shift.end_time.date() > shift.start_time.date()


def _is_weekend_shift(shift: Shift) -> bool:
    return shift.start_time.weekday() >= 5


def _duration_hours(start: datetime, end: datetime) -> float:
    return max((end - start).total_seconds(), 0) / 3600.0


def shift_duration_hours(shift: Shift) -> float:
    return _duration_hours(shift.start_time, shift.end_time)


def _window_overlap_hours(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> float:
    overlap_start = max(start_a, start_b)
    overlap_end = min(end_a, end_b)
    if overlap_end <= overlap_start:
        return 0.0
    return _duration_hours(overlap_start, overlap_end)


def _week_window_for(dt: datetime) -> Tuple[datetime, datetime]:
    week_start_date = dt.date() - timedelta(days=dt.weekday())
    week_start = datetime.combine(week_start_date, time.min)
    week_end = week_start + timedelta(days=7)
    return week_start, week_end


def _day_window_for(dt: datetime) -> Tuple[datetime, datetime]:
    day_start = datetime.combine(dt.date(), time.min)
    day_end = day_start + timedelta(days=1)
    return day_start, day_end


def _fetch_employee_shifts(
    db: Session,
    tenant_id: int,
    employee_id: int,
    *,
    start_before: Optional[datetime] = None,
    end_after: Optional[datetime] = None,
    exclude_shift_id: Optional[int] = None,
) -> List[Shift]:
    query = db.query(Shift).filter(
        Shift.company_id == tenant_id,
        Shift.employee_id == employee_id,
    )
    if start_before is not None:
        query = query.filter(Shift.start_time < start_before)
    if end_after is not None:
        query = query.filter(Shift.end_time > end_after)
    if exclude_shift_id is not None:
        query = query.filter(Shift.id != exclude_shift_id)
    return query.all()


def _sum_overlap_hours(
    shifts: Iterable[Shift],
    window_start: datetime,
    window_end: datetime,
) -> float:
    total = 0.0
    for s in shifts:
        total += _window_overlap_hours(s.start_time, s.end_time, window_start, window_end)
    return total


def _availability_state_for_shift(
    db: Session,
    tenant_id: int,
    employee_id: int,
    shift: Shift,
) -> str:
    start_window = datetime.combine(shift.start_time.date(), time.min)
    end_window = datetime.combine(shift.end_time.date(), time.min) + timedelta(days=1)
    entries = (
        db.query(Availability)
        .filter(
            Availability.company_id == tenant_id,
            Availability.employee_id == employee_id,
            Availability.date >= start_window,
            Availability.date < end_window,
        )
        .all()
    )
    if not entries:
        return AVAILABILITY_AVAILABLE

    prefer_not_found = False
    for entry in entries:
        if entry.is_available is False:
            return AVAILABILITY_UNAVAILABLE
        reason = _normalize(entry.reason)
        if "prefer not" in reason or "prefer_not" in reason:
            prefer_not_found = True
    if prefer_not_found:
        return AVAILABILITY_PREFER_NOT
    return AVAILABILITY_AVAILABLE


def _has_approved_time_off_overlap(
    db: Session,
    tenant_id: int,
    employee_id: int,
    shift: Shift,
) -> bool:
    overlap = (
        db.query(TimeOffRequest)
        .filter(
            TimeOffRequest.company_id == tenant_id,
            TimeOffRequest.employee_id == employee_id,
            TimeOffRequest.status == "approved",
            TimeOffRequest.end_date > shift.start_time,
            TimeOffRequest.start_date < shift.end_time,
        )
        .first()
    )
    return overlap is not None


def _has_shift_overlap(
    db: Session,
    tenant_id: int,
    employee_id: int,
    shift: Shift,
) -> bool:
    overlap = (
        db.query(Shift)
        .filter(
            Shift.company_id == tenant_id,
            Shift.employee_id == employee_id,
            Shift.id != shift.id,
            Shift.end_time > shift.start_time,
            Shift.start_time < shift.end_time,
        )
        .first()
    )
    return overlap is not None


def _role_history_by_employee(
    db: Session,
    tenant_id: int,
    employee_ids: List[int],
) -> Dict[int, List[str]]:
    if not employee_ids:
        return {}
    rows = (
        db.query(Shift.employee_id, Shift.role_type)
        .filter(
            Shift.company_id == tenant_id,
            Shift.employee_id.in_(employee_ids),
            Shift.role_type.isnot(None),
        )
        .all()
    )
    role_history: Dict[int, List[str]] = {eid: [] for eid in employee_ids}
    for employee_id, role_type in rows:
        if role_type:
            role_history.setdefault(employee_id, []).append(role_type)
    return role_history


def _skill_level(
    employee: User,
    shift: Shift,
    preference: Optional[EmployeePreference],
    role_history: List[str],
) -> Optional[str]:
    required_role = _normalize(shift.role_type)
    if not required_role:
        return SKILL_EXACT

    employee_role = _normalize(employee.role)
    historical_roles = {_normalize(r) for r in role_history if r}

    if employee_role == required_role or required_role in historical_roles:
        return SKILL_EXACT

    # Existing app stores "employee" as generic role. Treat this as exact only when no skill
    # history exists yet to avoid over-constraining newly created employees.
    if employee_role == "employee" and not historical_roles:
        return SKILL_EXACT

    secondary_role = _normalize(preference.secondary_role_type if preference else None)
    if secondary_role and secondary_role == required_role:
        return SKILL_SECONDARY

    return None


def _rest_gaps(
    db: Session,
    tenant_id: int,
    employee_id: int,
    shift: Shift,
) -> Tuple[Optional[float], Optional[float]]:
    previous_shift = (
        db.query(Shift)
        .filter(
            Shift.company_id == tenant_id,
            Shift.employee_id == employee_id,
            Shift.id != shift.id,
            Shift.end_time <= shift.start_time,
        )
        .order_by(Shift.end_time.desc())
        .first()
    )
    next_shift = (
        db.query(Shift)
        .filter(
            Shift.company_id == tenant_id,
            Shift.employee_id == employee_id,
            Shift.id != shift.id,
            Shift.start_time >= shift.end_time,
        )
        .order_by(Shift.start_time.asc())
        .first()
    )

    gap_before = None
    gap_after = None
    if previous_shift is not None:
        gap_before = _duration_hours(previous_shift.end_time, shift.start_time)
    if next_shift is not None:
        gap_after = _duration_hours(shift.end_time, next_shift.start_time)
    return gap_before, gap_after


def _rest_margin_hours(
    gap_before: Optional[float],
    gap_after: Optional[float],
    min_rest_hours: float,
) -> float:
    synthetic_gap = min_rest_hours + 24.0
    gaps = [gap_before if gap_before is not None else synthetic_gap]
    gaps.append(gap_after if gap_after is not None else synthetic_gap)
    return max(min(gaps) - min_rest_hours, 0.0)


def _matches_preferred_time(shift: Shift, preference: Optional[EmployeePreference]) -> bool:
    if preference is None:
        return False
    if preference.preferred_start_hour is None or preference.preferred_end_hour is None:
        return False
    shift_start = shift.start_time.hour + (shift.start_time.minute / 60.0)
    shift_end = shift.end_time.hour + (shift.end_time.minute / 60.0)
    start_hour = float(preference.preferred_start_hour)
    end_hour = float(preference.preferred_end_hour)

    if start_hour <= end_hour:
        return start_hour <= shift_start and shift_end <= end_hour
    # Overnight preference window (e.g., 22 -> 6)
    return shift_start >= start_hour or shift_end <= end_hour


def _count_special_shifts_last_4_weeks(
    db: Session,
    tenant_id: int,
    employee_id: int,
    shift: Shift,
) -> Tuple[int, int]:
    window_start = shift.start_time - timedelta(days=28)
    window_end = shift.start_time
    rows = (
        db.query(Shift)
        .filter(
            Shift.company_id == tenant_id,
            Shift.employee_id == employee_id,
            Shift.start_time >= window_start,
            Shift.start_time < window_end,
        )
        .all()
    )
    weekend_count = sum(1 for row in rows if _is_weekend_shift(row))
    night_count = sum(1 for row in rows if _is_night_shift(row))
    return weekend_count, night_count


def _employee_preference_map(
    db: Session,
    tenant_id: int,
    employee_ids: List[int],
) -> Dict[int, EmployeePreference]:
    if not employee_ids:
        return {}
    rows = (
        db.query(EmployeePreference)
        .filter(
            EmployeePreference.tenant_id == tenant_id,
            EmployeePreference.employee_id.in_(employee_ids),
        )
        .all()
    )
    return {row.employee_id: row for row in rows}


def get_or_default_contract_rule(db: Session, tenant_id: int) -> ContractRule:
    rule = db.query(ContractRule).filter(ContractRule.tenant_id == tenant_id).first()
    if rule is not None:
        return rule
    return ContractRule(
        tenant_id=tenant_id,
        min_rest_hours=DEFAULT_MIN_REST_HOURS,
        max_hours_day=DEFAULT_MAX_HOURS_DAY,
        max_hours_week=DEFAULT_MAX_HOURS_WEEK,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


def get_or_default_tenant_settings(db: Session, tenant_id: int) -> TenantSchedulingSettings:
    settings = (
        db.query(TenantSchedulingSettings)
        .filter(TenantSchedulingSettings.tenant_id == tenant_id)
        .first()
    )
    if settings is not None:
        return settings
    return TenantSchedulingSettings(
        tenant_id=tenant_id,
        open_shift_mode=OPEN_SHIFT_MODE_RECOMMEND_ONLY,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


def get_or_default_scoring_config(
    db: Session,
    tenant_id: int,
    *,
    create_if_missing: bool,
) -> AIScoringConfig:
    config = db.query(AIScoringConfig).filter(AIScoringConfig.tenant_id == tenant_id).first()
    if config is not None:
        return config

    default_config = AIScoringConfig(
        tenant_id=tenant_id,
        availability_weight=25.0,
        skill_match_weight=25.0,
        hours_balance_weight=20.0,
        rest_margin_weight=15.0,
        weekend_balance_weight=10.0,
        night_balance_weight=10.0,
        preference_weight=5.0,
        min_score_threshold=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    if create_if_missing:
        db.add(default_config)
        db.commit()
        db.refresh(default_config)
    return default_config


def update_scoring_config(
    db: Session,
    tenant_id: int,
    updates: Dict[str, Any],
) -> AIScoringConfig:
    config = get_or_default_scoring_config(db, tenant_id, create_if_missing=True)
    for key, value in updates.items():
        setattr(config, key, value)
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def hard_constraint_filter(
    db: Session,
    *,
    shift: Shift,
    employees: List[User],
    tenant_id: int,
    contract_rule: ContractRule,
    tenant_settings: TenantSchedulingSettings,
) -> Tuple[List[CandidateContext], Dict[int, List[str]]]:
    employee_ids = [emp.id for emp in employees]
    preferences = _employee_preference_map(db, tenant_id, employee_ids)
    role_history = _role_history_by_employee(db, tenant_id, employee_ids)
    shift_hours = shift_duration_hours(shift)

    eligible: List[CandidateContext] = []
    rejected: Dict[int, List[str]] = {}

    for employee in sorted(employees, key=lambda row: row.id):
        reasons: List[str] = []
        flags: List[str] = []
        preference = preferences.get(employee.id)

        availability_state = _availability_state_for_shift(db, tenant_id, employee.id, shift)
        if availability_state == AVAILABILITY_UNAVAILABLE:
            reasons.append("UNAVAILABLE")
        elif availability_state == AVAILABILITY_PREFER_NOT:
            flags.append("PREFER_NOT")

        if _has_approved_time_off_overlap(db, tenant_id, employee.id, shift):
            reasons.append("APPROVED_TIME_OFF_OVERLAP")

        if _has_shift_overlap(db, tenant_id, employee.id, shift):
            reasons.append("OVERLAPPING_ASSIGNED_SHIFT")

        day_start, day_end = _day_window_for(shift.start_time)
        day_shifts = _fetch_employee_shifts(
            db,
            tenant_id,
            employee.id,
            start_before=day_end,
            end_after=day_start,
            exclude_shift_id=shift.id,
        )
        existing_day_hours = _sum_overlap_hours(day_shifts, day_start, day_end)
        if existing_day_hours + shift_hours > float(contract_rule.max_hours_day):
            reasons.append("MAX_HOURS_DAY_EXCEEDED")

        week_start, week_end = _week_window_for(shift.start_time)
        week_shifts = _fetch_employee_shifts(
            db,
            tenant_id,
            employee.id,
            start_before=week_end,
            end_after=week_start,
            exclude_shift_id=shift.id,
        )
        existing_week_hours = _sum_overlap_hours(week_shifts, week_start, week_end)
        if existing_week_hours + shift_hours > float(contract_rule.max_hours_week):
            reasons.append("MAX_HOURS_WEEK_EXCEEDED")

        gap_before, gap_after = _rest_gaps(db, tenant_id, employee.id, shift)
        min_rest_hours = float(contract_rule.min_rest_hours)
        if gap_before is not None and gap_before < min_rest_hours:
            reasons.append("MIN_REST_HOURS_VIOLATION")
        if gap_after is not None and gap_after < min_rest_hours:
            reasons.append("MIN_REST_HOURS_VIOLATION")

        skill_level = _skill_level(
            employee=employee,
            shift=shift,
            preference=preference,
            role_history=role_history.get(employee.id, []),
        )
        if skill_level is None:
            reasons.append("ROLE_OR_SKILL_MISMATCH")
        elif skill_level == SKILL_SECONDARY:
            flags.append("SECONDARY_SKILL_MATCH")

        if _is_open_shift(shift):
            open_shift_participation_enabled = (
                preference.open_shift_participation_enabled if preference else True
            )
            if not open_shift_participation_enabled:
                reasons.append("OPEN_SHIFT_PARTICIPATION_DISABLED")

            tenant_mode = _normalize(tenant_settings.open_shift_mode).upper()
            allow_auto_assign_open_shifts = (
                preference.allow_auto_assign_open_shifts if preference else False
            )
            if tenant_mode == OPEN_SHIFT_MODE_AUTO_ASSIGN and not allow_auto_assign_open_shifts:
                reasons.append("OPEN_SHIFT_AUTO_ASSIGN_NOT_ALLOWED")

        if reasons:
            rejected[employee.id] = sorted(set(reasons))
            continue

        weekend_count, night_count = _count_special_shifts_last_4_weeks(
            db, tenant_id, employee.id, shift
        )
        rest_margin = _rest_margin_hours(gap_before, gap_after, min_rest_hours)
        preference_match = _matches_preferred_time(shift, preference)

        eligible.append(
            CandidateContext(
                employee=employee,
                availability_state=availability_state,
                skill_level=skill_level or SKILL_EXACT,
                weekly_hours=existing_week_hours,
                rest_margin_hours=rest_margin,
                weekend_count_last_4_weeks=weekend_count,
                night_count_last_4_weeks=night_count,
                preference_match=preference_match,
                flags=flags,
            )
        )

    return eligible, rejected


def _inverse_normalize(value: float, min_value: float, max_value: float) -> float:
    if max_value == min_value:
        return 1.0
    return (max_value - value) / (max_value - min_value)


def _direct_normalize(value: float, max_value: float) -> float:
    if max_value <= 0:
        return 0.0
    return min(max(value / max_value, 0.0), 1.0)


def score_candidates(
    shift: Shift,
    employees: List[CandidateContext],
    scoring_config: AIScoringConfig,
) -> List[Dict[str, Any]]:
    del shift  # Deterministic scoring inputs are precomputed in CandidateContext.

    if not employees:
        return []

    weekly_hours_values = [entry.weekly_hours for entry in employees]
    rest_margin_values = [entry.rest_margin_hours for entry in employees]
    weekend_values = [float(entry.weekend_count_last_4_weeks) for entry in employees]
    night_values = [float(entry.night_count_last_4_weeks) for entry in employees]

    min_week_hours = min(weekly_hours_values)
    max_week_hours = max(weekly_hours_values)
    min_weekend = min(weekend_values)
    max_weekend = max(weekend_values)
    min_night = min(night_values)
    max_night = max(night_values)
    max_rest_margin = max(rest_margin_values)

    scored: List[Dict[str, Any]] = []
    for entry in employees:
        availability_score = float(scoring_config.availability_weight)
        if entry.availability_state == AVAILABILITY_PREFER_NOT:
            availability_score *= 0.5

        skill_match_score = float(scoring_config.skill_match_weight)
        if entry.skill_level == SKILL_SECONDARY:
            skill_match_score *= 0.7

        hours_balance_score = float(scoring_config.hours_balance_weight) * _inverse_normalize(
            entry.weekly_hours,
            min_week_hours,
            max_week_hours,
        )
        rest_margin_score = float(scoring_config.rest_margin_weight) * _direct_normalize(
            entry.rest_margin_hours,
            max_rest_margin,
        )
        weekend_balance_score = float(scoring_config.weekend_balance_weight) * _inverse_normalize(
            float(entry.weekend_count_last_4_weeks),
            min_weekend,
            max_weekend,
        )
        night_balance_score = float(scoring_config.night_balance_weight) * _inverse_normalize(
            float(entry.night_count_last_4_weeks),
            min_night,
            max_night,
        )
        preference_score = (
            float(scoring_config.preference_weight) if entry.preference_match else 0.0
        )

        total_score = (
            availability_score
            + skill_match_score
            + hours_balance_score
            + rest_margin_score
            + weekend_balance_score
            + night_balance_score
            + preference_score
        )

        scored.append(
            {
                "employee_id": entry.employee.id,
                "employee_name": entry.employee.full_name or entry.employee.email,
                "total_score": round(total_score, 4),
                "score_breakdown": {
                    "availability_score": round(availability_score, 4),
                    "skill_match_score": round(skill_match_score, 4),
                    "hours_balance_score": round(hours_balance_score, 4),
                    "rest_margin_score": round(rest_margin_score, 4),
                    "weekend_balance_score": round(weekend_balance_score, 4),
                    "night_balance_score": round(night_balance_score, 4),
                    "preference_score": round(preference_score, 4),
                },
                "flags": sorted(set(entry.flags)),
            }
        )

    scored.sort(key=lambda item: (-item["total_score"], item["employee_id"]))
    if scoring_config.min_score_threshold is not None:
        threshold = float(scoring_config.min_score_threshold)
        scored = [item for item in scored if item["total_score"] >= threshold]
    return scored


def build_fairness_summary(
    shift_suggestions: List[Dict[str, Any]],
    shift_map: Dict[int, Shift],
    employee_map: Dict[int, User],
) -> List[Dict[str, Any]]:
    stats: Dict[int, Dict[str, Any]] = {}
    for suggestion in shift_suggestions:
        employee_id = suggestion.get("recommended_employee_id")
        shift_id = suggestion.get("shift_id")
        if not employee_id or not shift_id:
            continue
        shift = shift_map.get(int(shift_id))
        employee = employee_map.get(int(employee_id))
        if shift is None or employee is None:
            continue
        row = stats.setdefault(
            employee_id,
            {
                "employee_id": employee_id,
                "employee_name": employee.full_name or employee.email,
                "recommended_shift_count": 0,
                "recommended_hours": 0.0,
            },
        )
        row["recommended_shift_count"] += 1
        row["recommended_hours"] += shift_duration_hours(shift)

    summary = list(stats.values())
    for row in summary:
        row["recommended_hours"] = round(float(row["recommended_hours"]), 2)
    summary.sort(key=lambda row: (-row["recommended_shift_count"], row["employee_id"]))
    return summary


def create_assignment_audit_log(
    db: Session,
    *,
    tenant_id: int,
    shift_id: int,
    employee_id: int,
    created_by_user_id: int,
    details: Optional[str] = None,
) -> None:
    log = AssignmentAuditLog(
        tenant_id=tenant_id,
        shift_id=shift_id,
        employee_id=employee_id,
        action="AI_ASSIGNMENT_APPLIED",
        details=details,
        created_by_user_id=created_by_user_id,
    )
    db.add(log)
