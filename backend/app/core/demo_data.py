import logging
from datetime import datetime, timedelta
import random
from typing import Dict, List, Any

from sqlalchemy.orm import Session
from app.db.models import User, Shift, Company, UserRole
from app.models.ai_scoring import (
    AIScoringConfig, 
    EmployeePreference, 
    AIFeedbackLoop,
    TenantSchedulingSettings,
    ContractRule,
    OPEN_SHIFT_MODE_RECOMMEND_ONLY,
    AssignmentAuditLog
)
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

def seed_ai_demo(db: Session) -> Dict[str, Any]:
    """
    Seeds the database with AI demo data.
    """
    try:
        logger.info("🌱 Starting AI Demo Data Seeding...")
        
        results = {
            "company": None,
            "employees_created": 0,
            "shifts_created": 0,
            "historical_shifts_created": 0
        }

        # 1. Create or Get Demo Company
        company = db.query(Company).filter(Company.name == "AI Demo Corp").first()
        if not company:
            company = Company(name="AI Demo Corp", status="active")
            db.add(company)
            db.commit()
            db.refresh(company)
        results["company"] = company.name

        # 2. Setup AI Config & Rules
        ai_config = db.query(AIScoringConfig).filter(AIScoringConfig.tenant_id == company.id).first()
        if not ai_config:
            ai_config = AIScoringConfig(
                tenant_id=company.id,
                availability_weight=25.0,
                skill_match_weight=25.0,
                hours_balance_weight=20.0,
                rest_margin_weight=15.0,
                weekend_balance_weight=10.0,
                night_balance_weight=10.0,
                preference_weight=5.0
            )
            db.add(ai_config)

        contract = db.query(ContractRule).filter(ContractRule.tenant_id == company.id).first()
        if not contract:
            contract = ContractRule(
                tenant_id=company.id,
                max_hours_week=48.0,
                max_hours_day=12.0,
                min_rest_hours=11.0
            )
            db.add(contract)
        
        settings = db.query(TenantSchedulingSettings).filter(TenantSchedulingSettings.tenant_id == company.id).first()
        if not settings:
            settings = TenantSchedulingSettings(
                tenant_id=company.id,
                open_shift_mode=OPEN_SHIFT_MODE_RECOMMEND_ONLY
            )
            db.add(settings)
        db.commit()

        # 3. Create Employees with specific profiles
        profiles = [
            {"name": "Alice Expert", "role": "Senior Nurse", "email": "alice.ai@demo.com", "hours_to_assign": 0},
            {"name": "Bob Busy", "role": "Senior Nurse", "email": "bob.ai@demo.com", "hours_to_assign": 40},
            {"name": "Charlie Junior", "role": "Nurse", "email": "charlie.ai@demo.com", "hours_to_assign": 10},
            {"name": "Diana Flex", "role": "Care Assistant", "email": "diana.ai@demo.com", "hours_to_assign": 20},
        ]

        employees = {}
        for p in profiles:
            user = db.query(User).filter(User.email == p["email"]).first()
            if not user:
                user = User(
                    full_name=p["name"],
                    email=p["email"],
                    hashed_password=get_password_hash("password"),
                    role=p["role"],
                    company_id=company.id,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                results["employees_created"] += 1
            
            employees[p["name"]] = user

            # Add Preferences
            pref = db.query(EmployeePreference).filter(EmployeePreference.employee_id == user.id).first()
            if not pref:
                pref = EmployeePreference(
                    tenant_id=company.id,
                    employee_id=user.id,
                    open_shift_participation_enabled=True,
                    preferred_start_hour=8 if "Expert" in p["name"] else None
                )
                if "Flex" in p["name"]:
                    pref.secondary_role_type = "Nurse"
                db.add(pref)
            db.commit()

            # Assign Shifts to simulate workload
            if p["hours_to_assign"] > 0:
                start_of_week = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) \
                                - timedelta(days=datetime.now().weekday())
                
                existing_count = db.query(Shift).filter(
                    Shift.employee_id == user.id, 
                    Shift.start_time >= start_of_week
                ).count()
                
                if existing_count == 0:
                    hours_created = 0
                    day_offset = 0
                    while hours_created < p["hours_to_assign"]:
                        shift_len = 8
                        s_start = start_of_week + timedelta(days=day_offset, hours=8)
                        s_end = s_start + timedelta(hours=shift_len)
                        
                        shift = Shift(
                            company_id=company.id,
                            employee_id=user.id,
                            start_time=s_start,
                            end_time=s_end,
                            role_type=p["role"],
                            status="assigned"
                        )
                        db.add(shift)
                        hours_created += shift_len
                        day_offset += 1
                    db.commit()

        # 4. Create Shifts for Next Week (Target for AI)
        today = datetime.now().date()
        next_monday = today + timedelta(days=(7 - today.weekday()))
        
        shifts_to_create = [
            {"day": 0, "start": 8, "end": 16, "role": "Senior Nurse"},
            {"day": 0, "start": 14, "end": 22, "role": "Nurse"},
            {"day": 1, "start": 8, "end": 16, "role": "Senior Nurse"},
            {"day": 1, "start": 14, "end": 22, "role": "Care Assistant"},
            {"day": 2, "start": 8, "end": 16, "role": "Senior Nurse"}, 
        ]

        for s in shifts_to_create:
            shift_date = next_monday + timedelta(days=s["day"])
            start_dt = datetime.combine(shift_date, datetime.min.time().replace(hour=s["start"]))
            
            exists = db.query(Shift).filter(
                Shift.company_id == company.id,
                Shift.start_time == start_dt,
                Shift.role_type == s["role"]
            ).first()
            
            if not exists:
                end_dt = datetime.combine(shift_date, datetime.min.time().replace(hour=s["end"]))
                shift = Shift(
                    company_id=company.id,
                    start_time=start_dt,
                    end_time=end_dt,
                    role_type=s["role"],
                    status="open",
                    employee_id=None
                )
                db.add(shift)
                results["shifts_created"] += 1
        db.commit()

        # 5. Populate History (Assignments & Feedback)
        alice = employees["Alice Expert"]
        bob = employees["Bob Busy"]
        
        history_start = datetime.now().date() - timedelta(weeks=4)
        
        # Check if we already have historical shifts to avoid dupes on re-run
        # Simplistic check: if we have shifts ~4 weeks ago
        check_date = history_start
        existing_history = db.query(Shift).filter(
            Shift.company_id == company.id,
            Shift.start_time >= datetime.combine(check_date, datetime.min.time()),
            Shift.start_time < datetime.combine(check_date + timedelta(days=1), datetime.min.time())
        ).count()

        if existing_history == 0:
            for i in range(20):
                shift_date = history_start + timedelta(days=i)
                start_dt = datetime.combine(shift_date, datetime.min.time().replace(hour=8))
                end_dt = datetime.combine(shift_date, datetime.min.time().replace(hour=16))
                
                past_shift = Shift(
                    company_id=company.id,
                    start_time=start_dt,
                    end_time=end_dt,
                    role_type="Senior Nurse",
                    status="assigned",
                    employee_id=bob.id
                )
                db.add(past_shift)
                db.commit()
                db.refresh(past_shift)
                results["historical_shifts_created"] += 1
                
                if i < 10:
                    past_shift.employee_id = alice.id
                    db.add(past_shift)
                    log = AssignmentAuditLog(
                        tenant_id=company.id,
                        shift_id=past_shift.id,
                        employee_id=alice.id,
                        action="AI_ASSIGNMENT_APPLIED",
                        details="AI confidence: 0.95",
                        created_by_user_id=None,
                        created_at=shift_date
                    )
                    db.add(log)
                else:
                    past_shift.employee_id = bob.id
                    db.add(past_shift)
                    log_ai = AssignmentAuditLog(
                        tenant_id=company.id,
                        shift_id=past_shift.id,
                        employee_id=alice.id,
                        action="AI_ASSIGNMENT_APPLIED",
                        created_at=shift_date
                    )
                    db.add(log_ai)
                    
                    log_override = AssignmentAuditLog(
                        tenant_id=company.id,
                        shift_id=past_shift.id,
                        employee_id=bob.id,
                        action="MANUAL_OVERRIDE",
                        created_at=shift_date + timedelta(minutes=5)
                    )
                    db.add(log_override)
                    
                    fb = AIFeedbackLoop(
                        tenant_id=company.id,
                        shift_id=past_shift.id, 
                        original_employee_id=alice.id,
                        final_employee_id=bob.id,
                        change_reason="MANUAL_OVERRIDE",
                        created_at=shift_date + timedelta(minutes=5)
                    )
                    db.add(fb)
                
                db.commit()

        return results

    except Exception as e:
        logger.error(f"Error seeding demo data: {e}", exc_info=True)
        raise e
