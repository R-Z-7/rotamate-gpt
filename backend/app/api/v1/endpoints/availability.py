from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models import Availability, User
from app.schemas.availability import Availability as AvailabilitySchema, AvailabilityCreate, AvailabilityUpdate

router = APIRouter()

@router.get("", response_model=List[AvailabilitySchema])
@router.get("/", response_model=List[AvailabilitySchema], include_in_schema=False)
def read_availability(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # If admin, show all in company. If employee, show own.
    if current_user.role == "superadmin":
        return db.query(Availability).offset(skip).limit(limit).all()

    if current_user.role == "admin":
        if current_user.company_id:
            return db.query(Availability).filter(Availability.company_id == current_user.company_id).offset(skip).limit(limit).all()
            
    return db.query(Availability).filter(Availability.employee_id == current_user.id).offset(skip).limit(limit).all()

@router.post("", response_model=AvailabilitySchema)
@router.post("/", response_model=AvailabilitySchema, include_in_schema=False)
def create_availability(
    *,
    db: Session = Depends(deps.get_db),
    availability_in: AvailabilityCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # Employees submit their own availability
    availability = Availability(
        employee_id=current_user.id,
        company_id=current_user.company_id,
        date=availability_in.date,
        is_available=availability_in.is_available,
        reason=availability_in.reason,
        is_recurring=availability_in.is_recurring,
        day_of_week=availability_in.day_of_week,
    )
    db.add(availability)
    db.commit()
    db.refresh(availability)
    return availability

@router.put("/{id}", response_model=AvailabilitySchema)
def update_availability(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    availability_in: AvailabilityUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    availability = db.query(Availability).filter(Availability.id == id).first()
    if not availability:
        raise HTTPException(status_code=404, detail="Availability not found")
        
    if current_user.role == "employee" and availability.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if current_user.role == "admin" and availability.company_id != current_user.company_id:
        raise HTTPException(status_code=404, detail="Availability not found")
        
    update_data = availability_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(availability, field, value)
        
    db.add(availability)
    db.commit()
    db.refresh(availability)
    return availability

@router.delete("/{id}", response_model=AvailabilitySchema)
def delete_availability(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    availability = db.query(Availability).filter(Availability.id == id).first()
    if not availability:
        raise HTTPException(status_code=404, detail="Availability not found")
        
    if current_user.role == "employee" and availability.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if current_user.role == "admin" and availability.company_id != current_user.company_id:
        raise HTTPException(status_code=404, detail="Availability not found")
        
    db.delete(availability)
    db.commit()
    return availability
