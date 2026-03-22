from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AvailabilityBase(BaseModel):
    date: datetime
    is_available: bool
    reason: Optional[str] = None
    is_recurring: bool = False
    day_of_week: Optional[int] = None

class AvailabilityCreate(AvailabilityBase):
    pass

class AvailabilityUpdate(BaseModel):
    date: Optional[datetime] = None
    is_available: Optional[bool] = None
    reason: Optional[str] = None
    is_recurring: Optional[bool] = None
    day_of_week: Optional[int] = None

class AvailabilityInDBBase(AvailabilityBase):
    id: int
    employee_id: int
    
    class Config:
        from_attributes = True

class Availability(AvailabilityInDBBase):
    pass
