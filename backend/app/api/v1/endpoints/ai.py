from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models import User
# from langchain import ... # Import langchain components

router = APIRouter()

class RotaRequest(BaseModel):
    start_date: str
    end_date: str
    employee_ids: List[int]

class RotaResponse(BaseModel):
    generated_rota: str # Returns markdown or JSON string of the rota

from datetime import datetime, timedelta
from app.core.config import settings

@router.post("/generate", response_model=List[Any]) # Changed return type to list for now
def generate_rota(
    *,
    db: Session = Depends(deps.get_db),
    rota_request: RotaRequest,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    # Parse dates
    try:
        start_date = datetime.fromisoformat(rota_request.start_date.replace("Z", "+00:00"))
        end_date = datetime.fromisoformat(rota_request.end_date.replace("Z", "+00:00"))
    except ValueError:
        pass

    # Fetch Data
    employees = db.query(User).filter(User.id.in_(rota_request.employee_ids)).all()
    if not employees:
        raise HTTPException(status_code=400, detail="No employees found")
        
    # Validation: Ensure all employees belong to the same company as requestor
    if current_user.role != "superadmin":
        for emp in employees:
            if emp.company_id != current_user.company_id:
                raise HTTPException(status_code=400, detail="Cannot generate rota for employees of another company")

    # availabilities = db.query(Availability)... # For now pass empty or impl fetch logic
    availabilities = []
    # time_off = ...
    time_off = []
    
    if not settings.OPENAI_API_KEY:
        # Fallback to stub if key not present
        return [
            {"employee_id": employees[0].id, "start_time": start_date.isoformat(), "end_time": (start_date + timedelta(hours=8)).isoformat(), "role_type": "Manager"},
            {"employee_id": employees[1].id if len(employees)>1 else employees[0].id, "start_time": start_date.isoformat(), "end_time": (start_date + timedelta(hours=8)).isoformat(), "role_type": "Bar"},
        ]

    # Generate
    from app.services.ai_service import ai_service
    generated_shifts = ai_service.generate_rota(
        start_date, end_date, employees, availabilities, time_off
    )
    
    return generated_shifts
