import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import AutomationConfig, Shift, User
from app.services.ai_scoring_service import (
    get_or_default_contract_rule,
    get_or_default_tenant_settings,
    get_or_default_scoring_config,
    hard_constraint_filter,
    score_candidates
)

logger = logging.getLogger(__name__)

def generate_weekly_template(db: Session, tenant_id: int, start_date: datetime):
    # Generates 2 shifts per day for 7 days
    for day_offset in range(7):
        date = start_date + timedelta(days=day_offset)
        # Early shift 08:00 - 16:00
        shift1 = Shift(
            company_id=tenant_id,
            start_time=date.replace(hour=8, minute=0),
            end_time=date.replace(hour=16, minute=0),
            role_type="Nurse",
            status="draft"
        )
        # Late shift 14:00 - 22:00
        shift2 = Shift(
            company_id=tenant_id,
            start_time=date.replace(hour=14, minute=0),
            end_time=date.replace(hour=22, minute=0),
            role_type="Admin",
            status="draft"
        )
        db.add(shift1)
        db.add(shift2)
    db.commit()

def run_automation_for_tenant(db: Session, tenant_id: int):
    config = db.query(AutomationConfig).filter(AutomationConfig.tenant_id == tenant_id).first()
    if not config or not config.is_enabled:
        return

    now = datetime.utcnow()
    # Target next week
    next_week_start = (now + timedelta(days=7 - now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Check if we already generated shifts for next week
    existing = db.query(Shift).filter(
        Shift.company_id == tenant_id,
        Shift.start_time >= next_week_start,
        Shift.start_time < next_week_start + timedelta(days=7)
    ).first()
    
    if not existing:
        generate_weekly_template(db, tenant_id, next_week_start)

    # Fetch unassigned shifts for next week
    unassigned_shifts = db.query(Shift).filter(
        Shift.company_id == tenant_id,
        Shift.start_time >= next_week_start,
        Shift.start_time < next_week_start + timedelta(days=7),
        Shift.employee_id == None,
        Shift.status != "open"
    ).all()

    if not unassigned_shifts:
        return

    employees = db.query(User).filter(
        User.company_id == tenant_id,
        User.is_active == True,
        User.role == "employee"
    ).all()

    if not employees:
        return

    contract_rule = get_or_default_contract_rule(db, tenant_id)
    tenant_settings = get_or_default_tenant_settings(db, tenant_id)
    scoring_config = get_or_default_scoring_config(db, tenant_id, create_if_missing=True)

    for shift in unassigned_shifts:
        eligible, _ = hard_constraint_filter(
            db,
            shift=shift,
            employees=employees,
            tenant_id=tenant_id,
            contract_rule=contract_rule,
            tenant_settings=tenant_settings,
        )
        scored = score_candidates(shift, eligible, scoring_config)
        
        if scored:
            best_candidate = scored[0]
            shift.employee_id = best_candidate["employee_id"]
            shift.status = "assigned" # Automatically publish them
        else:
            if config.convert_to_open_shifts:
                shift.status = "open"
                
        db.add(shift)

    db.commit()
    logger.info(f"Automation executed successfully for tenant {tenant_id}")
