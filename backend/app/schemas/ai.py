from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ScheduleRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    company_id: Optional[int] = None

class SuggestedShift(BaseModel):
    employee_id: int
    employee_name: str
    start_time: datetime
    end_time: datetime
    role: str
    reason: Optional[str] = None

class AIResponse(BaseModel):
    shifts: List[SuggestedShift]
    explanation: Optional[str] = None
