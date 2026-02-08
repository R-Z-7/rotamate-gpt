from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models import Availability, User
from app.schemas.availability import Availability as AvailabilitySchema, AvailabilityCreate

router = APIRouter()

@router.get("/", response_model=List[AvailabilitySchema])
def read_availability(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # If admin, show all? If employee, show own?
    if current_user.role == "admin":
        return db.query(Availability).offset(skip).limit(limit).all()
    return db.query(Availability).filter(Availability.employee_id == current_user.id).offset(skip).limit(limit).all()

@router.post("/", response_model=AvailabilitySchema)
def create_availability(
    *,
    db: Session = Depends(deps.get_db),
    availability_in: AvailabilityCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # Employees submit their own availability
    availability = Availability(
        employee_id=current_user.id,
        date=availability_in.date,
        is_available=availability_in.is_available,
        reason=availability_in.reason,
    )
    db.add(availability)
    db.commit()
    db.refresh(availability)
    return availability
