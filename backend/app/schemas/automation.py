from pydantic import BaseModel
from typing import Optional

class AutomationConfigBase(BaseModel):
    is_enabled: bool = False
    schedule_type: str = "weekly"
    run_day_of_week: int = 0
    run_time: str = "00:00"
    convert_to_open_shifts: bool = True

class AutomationConfigUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    schedule_type: Optional[str] = None
    run_day_of_week: Optional[int] = None
    run_time: Optional[str] = None
    convert_to_open_shifts: Optional[bool] = None

class AutomationConfig(AutomationConfigBase):
    id: int
    tenant_id: int

    class Config:
        from_attributes = True
