from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AvailabilityBase(BaseModel):
    date: datetime
    is_available: bool
    reason: Optional[str] = None

class AvailabilityCreate(AvailabilityBase):
    pass

class AvailabilityInDBBase(AvailabilityBase):
    id: int
    employee_id: int
    
    class Config:
        from_attributes = True

class Availability(AvailabilityInDBBase):
    pass
