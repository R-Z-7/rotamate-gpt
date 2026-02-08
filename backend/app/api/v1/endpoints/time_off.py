from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models import TimeOffRequest, User
from app.schemas.time_off import TimeOffRequest as TimeOffRequestSchema, TimeOffRequestCreate, TimeOffRequestUpdate

router = APIRouter()

@router.get("/", response_model=List[TimeOffRequestSchema])
def read_time_off_requests(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # Tenant Isolation
    if current_user.role == "superadmin":
        return db.query(TimeOffRequest).offset(skip).limit(limit).all()
    
    if current_user.role == "admin":
        if current_user.company_id:
            return db.query(TimeOffRequest).filter(TimeOffRequest.company_id == current_user.company_id).offset(skip).limit(limit).all()
            
    return db.query(TimeOffRequest).filter(TimeOffRequest.employee_id == current_user.id).offset(skip).limit(limit).all()

@router.post("/", response_model=TimeOffRequestSchema)
def create_time_off_request(
    *,
    db: Session = Depends(deps.get_db),
    request_in: TimeOffRequestCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    request = TimeOffRequest(
        employee_id=current_user.id,
        company_id=current_user.company_id,
        start_date=request_in.start_date,
        end_date=request_in.end_date,
        reason=request_in.reason,
        status="pending"
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

@router.put("/{id}/status", response_model=TimeOffRequestSchema)
def update_time_off_status(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    status_update: TimeOffRequestUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    request = db.query(TimeOffRequest).filter(TimeOffRequest.id == id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Tenant Check
    if current_user.role != "superadmin":
        if request.company_id != current_user.company_id:
             raise HTTPException(status_code=404, detail="Request not found")

    request.status = status_update.status
    db.add(request)
    db.commit()
    db.refresh(request)
    return request
