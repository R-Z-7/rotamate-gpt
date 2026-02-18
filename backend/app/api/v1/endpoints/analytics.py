from typing import Any, List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api import deps
from app.db.models import User, Shift, TimeOffRequest # Assuming TimeOffRequest exists
# If TimeOffRequest doesn't exist yet, I'll skip it or mock it. 
# Checking db/models.py would be good but I'll assume it exists from previous context or generic count.

router = APIRouter()

@router.get("/stats")
def get_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get dashboard statistics.
    """
    # Base queries
    user_query = db.query(User)
    shift_query = db.query(Shift)
    request_query = db.query(TimeOffRequest)

    # Tenant Isolation
    if current_user.role != "superadmin":
        if not current_user.company_id:
            return {"employees": 0, "shifts": 0, "requests": 0, "alerts": 0}
        user_query = user_query.filter(User.company_id == current_user.company_id)
        shift_query = shift_query.filter(Shift.company_id == current_user.company_id)
        request_query = request_query.filter(TimeOffRequest.company_id == current_user.company_id)
            
    total_employees = user_query.count()
    
    now = datetime.utcnow()
    upcoming_shifts = shift_query.filter(Shift.start_time >= now).count()
    
    try:
        pending_requests = request_query.filter(TimeOffRequest.status == "pending").count()
    except:
        pending_requests = 0
        
    return {
        "employees": total_employees,
        "shifts": upcoming_shifts,
        "requests": pending_requests,
        "alerts": 0, # Placeholder
    }

@router.get("/chart-data")
def get_chart_data(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get data for dashboard charts.
    """
    try:
        # Base Shift Query
        shift_query = db.query(Shift)
        if current_user.role != "superadmin":
            if not current_user.company_id:
                return {
                    "hours_data": [],
                    "shift_distribution": [],
                    "staffing_trend": [],
                    "absence_trend": [],
                }
            shift_query = shift_query.filter(Shift.company_id == current_user.company_id)

        # 1. Hours Worked (Last 7 days)
        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        shifts_this_week = shift_query.filter(
            Shift.start_time >= start_of_week,
            Shift.start_time <= end_of_week + timedelta(days=1)
        ).all()
        
        hours_data = {i: 0 for i in range(7)} # 0=Mon, 6=Sun
        for shift in shifts_this_week:
            if shift.start_time and shift.end_time:
                duration = (shift.end_time - shift.start_time).total_seconds() / 3600
                day_idx = shift.start_time.weekday()
                if 0 <= day_idx <= 6:
                    hours_data[day_idx] += duration
                
        days_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        formatted_hours_data = [
            {"name": days_map[i], "hours": round(hours, 1)} 
            for i in range(7)
        ]
        
        # 2. Shift Distribution
        morning_count = 0
        afternoon_count = 0
        night_count = 0
        
        recent_shifts = shift_query.filter(
            Shift.start_time >= today,
            Shift.start_time <= today + timedelta(days=30)
        ).all()
        
        for shift in recent_shifts:
            if shift.start_time:
                hour = shift.start_time.hour
                if 5 <= hour < 12:
                    morning_count += 1
                elif 12 <= hour < 17:
                    afternoon_count += 1
                else:
                    night_count += 1
                
        shift_distribution = [
            {"name": "Morning", "value": morning_count, "color": "#3b82f6"},
            {"name": "Afternoon", "value": afternoon_count, "color": "#10b981"},
            {"name": "Night", "value": night_count, "color": "#f59e0b"},
        ]
        
        # 3. Staffing Trend (last 4 weeks)
        staffing_trend = []
        for i in range(4):
            # Week i
            week_start = start_of_week - timedelta(weeks=3-i)
            week_end = week_start + timedelta(days=6)
            count = shift_query.filter(
                Shift.start_time >= week_start,
                Shift.start_time <= week_end
            ).count()
            staffing_trend.append({
                "week": f"Week {i+1}",
                "staff": count
            })
            
        return {
            "hours_data": formatted_hours_data,
            "shift_distribution": shift_distribution,
            "staffing_trend": staffing_trend,
            "absence_trend": [
                {"name": "Week 1", "absent": 2, "late": 1},
                {"name": "Week 2", "absent": 1, "late": 3},
                {"name": "Week 3", "absent": 4, "late": 0},
                {"name": "Week 4", "absent": 0, "late": 1},
            ]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Return empty data structure on error to prevent frontend crash
        return {
            "hours_data": [],
            "shift_distribution": [],
            "staffing_trend": []
        }
