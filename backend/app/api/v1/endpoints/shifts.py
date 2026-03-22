from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime

from app.api import deps
from app.db.models import Shift, User, Availability, ShiftOverrideRequest
from app.schemas.shift import Shift as ShiftSchema, ShiftCreate, ShiftUpdate
from app.services.notification_service import create_notification
from app.schemas.shift import Shift as ShiftSchema, ShiftCreate, ShiftUpdate

router = APIRouter()

@router.get("", response_model=List[ShiftSchema])
@router.get("/", response_model=List[ShiftSchema], include_in_schema=False)
def read_shifts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    start_date: datetime = None,
    end_date: datetime = None,
    employee_id: int = None,
    status: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    query = db.query(Shift)
    
    # Tenant Isolation
    if current_user.role != "superadmin":
        if not current_user.company_id:
            raise HTTPException(status_code=403, detail="User is not assigned to a company")
        query = query.filter(Shift.company_id == current_user.company_id)
    
    if start_date:
        query = query.filter(Shift.start_time >= start_date)
    if end_date:
        query = query.filter(Shift.end_time <= end_date)
    if employee_id:
        query = query.filter(Shift.employee_id == employee_id)
    if status:
        query = query.filter(Shift.status == status)
        
    shifts = query.offset(skip).limit(limit).all()
    return shifts

def check_shift_overlap(db: Session, employee_id: int, start_time: datetime, end_time: datetime, exclude_shift_id: int = None):
    query = db.query(Shift).filter(
        Shift.employee_id == employee_id,
        Shift.end_time > start_time,
        Shift.start_time < end_time
    )
    if exclude_shift_id:
        query = query.filter(Shift.id != exclude_shift_id)
    return query.first()

@router.post("", response_model=ShiftSchema)
@router.post("/", response_model=ShiftSchema, include_in_schema=False)
def create_shift(
    *,
    db: Session = Depends(deps.get_db),
    shift_in: ShiftCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    employee = db.query(User).filter(User.id == shift_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if not employee.is_active:
        raise HTTPException(status_code=400, detail="Cannot schedule an inactive employee")

    if current_user.role != "superadmin":
        if not current_user.company_id:
            raise HTTPException(status_code=403, detail="Admin has no company association")
        if employee.company_id != current_user.company_id:
            raise HTTPException(status_code=404, detail="Employee not found")
        company_id = current_user.company_id
    else:
        company_id = employee.company_id
        if not company_id:
            raise HTTPException(status_code=400, detail="Employee has no company association")
    
    # Check for overlaps
    if check_shift_overlap(db, shift_in.employee_id, shift_in.start_time, shift_in.end_time):
        raise HTTPException(status_code=400, detail="Shift overlaps with an existing shift")

    # Check availability
    shift_date = shift_in.start_time.replace(hour=0, minute=0, second=0, microsecond=0)
    availability = db.query(Availability).filter(
        Availability.employee_id == employee.id,
        Availability.date == shift_date
    ).first()
    
    requires_override = False
    if availability and not availability.is_available:
        requires_override = True
        if not shift_in.override_reason:
            raise HTTPException(status_code=400, detail="Employee is unavailable on this date. An override_reason is required.")

    shift = Shift(
        employee_id=shift_in.employee_id,
        company_id=company_id,
        start_time=shift_in.start_time,
        end_time=shift_in.end_time,
        role_type=shift_in.role_type,
        status=shift_in.status,
    )
    db.add(shift)
    db.flush()

    if requires_override:
        override_req = ShiftOverrideRequest(
            company_id=company_id,
            shift_id=shift.id,
            employee_id=employee.id,
            reason=shift_in.override_reason,
            status="pending"
        )
        db.add(override_req)

    db.commit()
    db.refresh(shift)
    
    create_notification(
        db=db,
        user_id=employee.id,
        company_id=company_id,
        title="New Shift",
        description=f"You have been assigned a shift on {shift_in.start_time.strftime('%Y-%m-%d')}"
    )
    if requires_override:
        create_notification(
            db=db,
            user_id=employee.id,
            company_id=company_id,
            title="Shift Override",
            description=f"An override request was created for your shift on {shift_in.start_time.strftime('%Y-%m-%d')} because you were marked unavailable.",
            notif_type="warning"
        )
        
    return shift

@router.put("/{id}", response_model=ShiftSchema)
def update_shift(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    shift_in: ShiftUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    shift = db.query(Shift).filter(Shift.id == id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Tenant Check
    if current_user.role != "superadmin":
        if shift.company_id != current_user.company_id:
            raise HTTPException(status_code=404, detail="Shift not found") # 404 to hide existence

    # Check for overlaps if times or employee changed
    start = shift_in.start_time or shift.start_time
    end = shift_in.end_time or shift.end_time
    emp_id = shift_in.employee_id or shift.employee_id

    employee = db.query(User).filter(User.id == emp_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if not employee.is_active:
        raise HTTPException(status_code=400, detail="Cannot schedule an inactive employee")
    if current_user.role != "superadmin":
        if not current_user.company_id or employee.company_id != current_user.company_id:
            raise HTTPException(status_code=404, detail="Employee not found")
    
    if check_shift_overlap(db, emp_id, start, end, exclude_shift_id=id):
        raise HTTPException(status_code=400, detail="Shift overlaps with an existing shift")
    
    # Check availability
    shift_date = start.replace(hour=0, minute=0, second=0, microsecond=0)
    availability = db.query(Availability).filter(
        Availability.employee_id == employee.id,
        Availability.date == shift_date
    ).first()
    
    requires_override = False
    if availability and not availability.is_available:
        requires_override = True
        if not shift_in.override_reason:
            raise HTTPException(status_code=400, detail="Employee is unavailable on this date. An override_reason is required.")
    
    update_data = shift_in.dict(exclude_unset=True)
    update_data.pop("override_reason", None)
    if current_user.role == "superadmin" and shift_in.employee_id is not None:
        update_data["company_id"] = employee.company_id
    for field, value in update_data.items():
        setattr(shift, field, value)
    
    db.add(shift)
    db.flush()
    
    if requires_override:
        override_req = db.query(ShiftOverrideRequest).filter(ShiftOverrideRequest.shift_id == shift.id).first()
        if not override_req:
            override_req = ShiftOverrideRequest(
                company_id=shift.company_id,
                shift_id=shift.id,
                employee_id=employee.id,
                reason=shift_in.override_reason,
                status="pending"
            )
            db.add(override_req)
        else:
            override_req.reason = shift_in.override_reason
            override_req.status = "pending"
            
    db.commit()
    db.refresh(shift)
    
    if shift_in.employee_id is not None:
        create_notification(
            db=db,
            user_id=shift_in.employee_id,
            company_id=shift.company_id,
            title="Shift Updated",
            description=f"Your shift on {shift.start_time.strftime('%Y-%m-%d')} has been updated."
        )
        
    return shift

@router.delete("/{id}", response_model=ShiftSchema)
def delete_shift(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    shift = db.query(Shift).filter(Shift.id == id).first()
    if not shift:
         raise HTTPException(status_code=404, detail="Shift not found")
    
    # Tenant Check
    if current_user.role != "superadmin":
        if shift.company_id != current_user.company_id:
             raise HTTPException(status_code=404, detail="Shift not found")

    db.delete(shift)
    db.commit()
    return shift

@router.post("/{id}/override/acknowledge", response_model=dict)
def acknowledge_override(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    override_req = db.query(ShiftOverrideRequest).filter(ShiftOverrideRequest.shift_id == id, ShiftOverrideRequest.employee_id == current_user.id).first()
    if not override_req:
        raise HTTPException(status_code=404, detail="Override request not found")
    
    override_req.status = "acknowledged"
    db.commit()
    return {"status": "success", "message": "Override acknowledged"}

@router.post("/{id}/override/request_change", response_model=dict)
def request_override_change(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    reason: str = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    override_req = db.query(ShiftOverrideRequest).filter(ShiftOverrideRequest.shift_id == id, ShiftOverrideRequest.employee_id == current_user.id).first()
    if not override_req:
        raise HTTPException(status_code=404, detail="Override request not found")
    
    override_req.status = "change_requested"
    override_req.reason = reason
    db.commit()
    return {"status": "success", "message": "Change requested"}

@router.post("/{id}/override/resolve", response_model=dict)
def resolve_override(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    status: str = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    override_req = db.query(ShiftOverrideRequest).join(Shift).filter(Shift.id == id).first()
    if not override_req:
        raise HTTPException(status_code=404, detail="Override request not found")
    if current_user.role != "superadmin" and override_req.company_id != current_user.company_id:
        raise HTTPException(status_code=404, detail="Override request not found")

    if status not in ["resolved", "acknowledged", "pending"]:
         raise HTTPException(status_code=400, detail="Invalid status")
         
    override_req.status = status
    db.commit()
    
    create_notification(
        db=db,
        user_id=override_req.employee_id,
        company_id=override_req.company_id,
        title=f"Override {status.capitalize()}",
        description=f"Your shift override request has been {status}."
    )
    
    return {"status": "success", "message": f"Override {status}"}

@router.post("/{id}/claim", response_model=ShiftSchema)
def claim_shift(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    shift = db.query(Shift).filter(Shift.id == id).first()
    if not shift:
         raise HTTPException(status_code=404, detail="Shift not found")
         
    if current_user.role != "superadmin" and shift.company_id != current_user.company_id:
         raise HTTPException(status_code=404, detail="Shift not found")
         
    if shift.status != "open":
         raise HTTPException(status_code=400, detail="Shift is not open")
         
    # Optional: check if they are active
    if not current_user.is_active:
         raise HTTPException(status_code=400, detail="Inactive employees cannot claim shifts")
         
    shift.employee_id = current_user.id
    shift.status = "assigned"
    db.commit()
    db.refresh(shift)
    
    create_notification(
        db=db,
        user_id=current_user.id,
        company_id=current_user.company_id,
        title="Shift Claimed",
        description=f"You successfully claimed the open shift on {shift.start_time.strftime('%Y-%m-%d')}."
    )
    
    return shift
