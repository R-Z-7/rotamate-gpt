from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import User

class TimeOffRequestBase(BaseModel):
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None
    status: str = "pending"

class TimeOffRequestCreate(TimeOffRequestBase):
    pass

class TimeOffRequestUpdate(BaseModel):
    status: str

class TimeOffRequestInDBBase(TimeOffRequestBase):
    id: int
    employee_id: int
    
    class Config:
        from_attributes = True

class TimeOffRequest(TimeOffRequestInDBBase):
    employee: Optional[User] = None
