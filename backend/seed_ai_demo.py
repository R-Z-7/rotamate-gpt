import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import User, Shift, Company, UserRole
from app.models.ai_scoring import (
    AIScoringConfig, 
    EmployeePreference, 
    AIFeedbackLoop,
    TenantSchedulingSettings,
    ContractRule,
    AssignmentAuditLog,
    OPEN_SHIFT_MODE_RECOMMEND_ONLY
)
from app.core.security import get_password_hash

def seed_ai_demo():
    db = SessionLocal()
    try:
        print("🌱 Starting AI Demo Data Seeding...")

        # 1. Create or Get Demo Company
        company = db.query(Company).filter(Company.name == "AI Demo Corp").first()
        if not company:
            company = Company(name="AI Demo Corp", status="active")
            db.add(company)
            db.commit()
            db.refresh(company)
        print(f"🏢 Company: {company.name}")

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
            # The "Perfect Match"
            {"name": "Alice Expert", "role": "Senior Nurse", "email": "alice.ai@demo.com", "hours_to_assign": 0},
            # The "Overworked" (High skill, but loaded hours)
            {"name": "Bob Busy", "role": "Senior Nurse", "email": "bob.ai@demo.com", "hours_to_assign": 40},
            # The "Junior" (Lower skill match for Senior roles)
            {"name": "Charlie Junior", "role": "Nurse", "email": "charlie.ai@demo.com", "hours_to_assign": 10},
            # The "Flexible" (Willing to do anything)
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
                    role=p["role"], # Using 'role' string column as job title
                    company_id=company.id,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            
            employees[p["name"]] = user

            # Add Preferences (Corrected)
            pref = db.query(EmployeePreference).filter(EmployeePreference.employee_id == user.id).first()
            if not pref:
                pref = EmployeePreference(
                    tenant_id=company.id,
                    employee_id=user.id,
                    open_shift_participation_enabled=True,
                    preferred_start_hour=8 if "Expert" in p["name"] else None
                )
                if "Flex" in p["name"]:
                    pref.secondary_role_type = "Nurse" # Secondary skill
                db.add(pref)
            db.commit()

            # Assign Shifts to simulate workload (if needed)
            if p["hours_to_assign"] > 0:
                # Create dummy assigned shifts for this week
                start_of_week = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) \
                                - timedelta(days=datetime.now().weekday())
                
                # Check if shifts already exist to avoid duplication on re-run
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

        print(f"👥 Created {len(employees)} employees")

        # 4. Create Shifts for Next Week (The Target for AI)
        today = datetime.now().date()
        next_monday = today + timedelta(days=(7 - today.weekday()))
        
        shifts_to_create = [
            {"day": 0, "start": 8, "end": 16, "role": "Senior Nurse"},
            {"day": 0, "start": 14, "end": 22, "role": "Nurse"},
            {"day": 1, "start": 8, "end": 16, "role": "Senior Nurse"},
            {"day": 1, "start": 14, "end": 22, "role": "Care Assistant"},
            {"day": 2, "start": 8, "end": 16, "role": "Senior Nurse"}, 
        ]

        created_shifts_count = 0
        for s in shifts_to_create:
            shift_date = next_monday + timedelta(days=s["day"])
            start_dt = datetime.combine(shift_date, datetime.min.time().replace(hour=s["start"]))
            
            # Check exist
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
                created_shifts_count += 1
        db.commit()
        print(f"📅 Created {created_shifts_count} open shifts for next week")

        # 5. Populate History (Assignments & Feedback)
        print("🧠 Seeding historical data (Assignments & Feedback)...")
        alice = employees["Alice Expert"]
        bob = employees["Bob Busy"]
        charlie = employees["Charlie Junior"]
        
        # Create shifts for the last 4 weeks to simulate history
        history_start = datetime.now().date() - timedelta(weeks=4)
        
        # We need a mix of:
        # 1. Successful AI Assignments (Audit Log only)
        # 2. Overridden Assignments (Audit Log + Feedback Loop)
        
        for i in range(20): # 20 historical shifts
            shift_date = history_start + timedelta(days=i)
            start_dt = datetime.combine(shift_date, datetime.min.time().replace(hour=8))
            end_dt = datetime.combine(shift_date, datetime.min.time().replace(hour=16))
            
            # Create the PAST shift
            past_shift = Shift(
                company_id=company.id,
                start_time=start_dt,
                end_time=end_dt,
                role_type="Senior Nurse",
                status="assigned",
                employee_id=bob.id # Assigned to Bob eventually
            )
            db.add(past_shift)
            db.commit() # Commit to get ID
            db.refresh(past_shift)
            
            # Scenario A: AI assigned Alice successfully (No override) - First 10
            if i < 10:
                past_shift.employee_id = alice.id
                db.add(past_shift)
                
                # Log the AI assignment
                log = AssignmentAuditLog(
                    tenant_id=company.id,
                    shift_id=past_shift.id,
                    employee_id=alice.id,
                    action="AI_ASSIGNMENT_APPLIED",
                    details="AI confidence: 0.95",
                    created_by_user_id=None, # System/AI
                    created_at=shift_date
                )
                db.add(log)
                
            # Scenario B: AI suggested Alice, but Admin overrode to Bob - Last 10
            else:
                past_shift.employee_id = bob.id
                db.add(past_shift)
                
                # 1. Log the AI suggestion (optional, but good for tracking what AI *wanted*)
                # Typically we log the *application*. If user applies then changes, or changes then applies.
                # Let's say AI applied Alice, then Admin changed to Bob.
                log_ai = AssignmentAuditLog(
                    tenant_id=company.id,
                    shift_id=past_shift.id,
                    employee_id=alice.id,
                    action="AI_ASSIGNMENT_APPLIED",
                    created_at=shift_date
                )
                db.add(log_ai)
                
                # 2. Log the Override
                log_override = AssignmentAuditLog(
                    tenant_id=company.id,
                    shift_id=past_shift.id,
                    employee_id=bob.id,
                    action="MANUAL_OVERRIDE",
                    created_at=shift_date + timedelta(minutes=5)
                )
                db.add(log_override)
                
                # 3. Create Feedback Loop Entry
                # Only if not exists
                fb_exists = db.query(AIFeedbackLoop).filter(AIFeedbackLoop.shift_id == past_shift.id).first()
                if not fb_exists:
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
        
        print("✅ Demo Data Seeding Complete!")
        print(f"👉 Use Company: {company.name} (Admin Login: admin@rotamate.com usually, but here we created new users)")
        print(f"👉 You can login with 'alice.ai@demo.com' / 'password' to see employee view, or use existing admin account if it belongs to this company.")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_ai_demo()
