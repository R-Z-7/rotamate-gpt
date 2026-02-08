from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.api import deps
from app.db.models import Shift, User
from app.schemas.shift import Shift as ShiftSchema, ShiftCreate, ShiftUpdate

router = APIRouter()

@router.get("/", response_model=List[ShiftSchema])
def read_shifts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role == "admin":
        shifts = db.query(Shift).offset(skip).limit(limit).all()
    else:
        # Employees only see their own shifts ? Or everyone's for transparency? 
        # Requirement: "My Schedule" vs "View availability of all staff". 
        # Let's say employees can see all for now or just theirs. 
        # Requirement: "View shifts" in Employee (Client). 
        # Usually rotas are visible to all.
        shifts = db.query(Shift).offset(skip).limit(limit).all()
    return shifts

@router.post("/", response_model=ShiftSchema)
def create_shift(
    *,
    db: Session = Depends(deps.get_db),
    shift_in: ShiftCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    shift = Shift(
        employee_id=shift_in.employee_id,
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
    
    update_data = shift_in.dict(exclude_unset=True)
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
    db.delete(shift)
    db.commit()
    return shift
