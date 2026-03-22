from pydantic import BaseModel
from typing import Optional

class ContractRuleBase(BaseModel):
    min_rest_hours: float = 11.0
    max_hours_day: float = 12.0
    max_hours_week: float = 48.0

class ContractRuleUpdate(ContractRuleBase):
    min_rest_hours: Optional[float] = None
    max_hours_day: Optional[float] = None
    max_hours_week: Optional[float] = None

class ContractRuleInDB(ContractRuleBase):
    id: int
    tenant_id: int

    class Config:
        from_attributes = True

class EmployeePreferenceBase(BaseModel):
    open_shift_participation_enabled: bool = True
    allow_auto_assign_open_shifts: bool = False
    preferred_start_hour: Optional[int] = None
    preferred_end_hour: Optional[int] = None
    secondary_role_type: Optional[str] = None

class EmployeePreferenceUpdate(EmployeePreferenceBase):
    open_shift_participation_enabled: Optional[bool] = None
    allow_auto_assign_open_shifts: Optional[bool] = None

class EmployeePreferenceInDB(EmployeePreferenceBase):
    id: int
    tenant_id: int
    employee_id: int

    class Config:
        from_attributes = True
