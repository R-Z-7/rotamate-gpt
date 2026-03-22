from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel
from app.schemas.user import User

class ShiftBase(BaseModel):
    start_time: datetime
    end_time: datetime
    role_type: str
    status: str = "assigned"

class ShiftCreate(ShiftBase):
    employee_id: Optional[int] = None
    override_reason: Optional[str] = None

class ShiftUpdate(ShiftBase):
    employee_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    override_reason: Optional[str] = None

class ShiftInDBBase(ShiftBase):
    id: int
    employee_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class Shift(ShiftInDBBase):
    employee: Optional[User] = None
    override_request: Optional[Any] = None
