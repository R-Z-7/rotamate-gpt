from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.api import deps
from app.db.models import Shift, User
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

    shift = Shift(
        employee_id=shift_in.employee_id,
        company_id=company_id,
        start_time=shift_in.start_time,
        end_time=shift_in.end_time,
        role_type=shift_in.role_type,
        status=shift_in.status,
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
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
    if current_user.role != "superadmin":
        if not current_user.company_id or employee.company_id != current_user.company_id:
            raise HTTPException(status_code=404, detail="Employee not found")
    
    if check_shift_overlap(db, emp_id, start, end, exclude_shift_id=id):
        raise HTTPException(status_code=400, detail="Shift overlaps with an existing shift")
    
    update_data = shift_in.dict(exclude_unset=True)
    if current_user.role == "superadmin" and shift_in.employee_id is not None:
        update_data["company_id"] = employee.company_id
    for field, value in update_data.items():
        setattr(shift, field, value)
    
    db.add(shift)
    db.commit()
    db.refresh(shift)
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
