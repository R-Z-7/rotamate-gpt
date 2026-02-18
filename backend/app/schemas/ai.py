from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


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


class AIScoringConfigBase(BaseModel):
    availability_weight: float = 25.0
    skill_match_weight: float = 25.0
    hours_balance_weight: float = 20.0
    rest_margin_weight: float = 15.0
    weekend_balance_weight: float = 10.0
    night_balance_weight: float = 10.0
    preference_weight: float = 5.0
    min_score_threshold: Optional[float] = None


class AIScoringConfigUpdate(BaseModel):
    availability_weight: Optional[float] = None
    skill_match_weight: Optional[float] = None
    hours_balance_weight: Optional[float] = None
    rest_margin_weight: Optional[float] = None
    weekend_balance_weight: Optional[float] = None
    night_balance_weight: Optional[float] = None
    preference_weight: Optional[float] = None
    min_score_threshold: Optional[float] = None
    tenant_id: Optional[int] = None
    clear_min_score_threshold: bool = False


class AIScoringConfigRead(AIScoringConfigBase):
    id: Optional[int] = None
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIAssignPreviewRequest(BaseModel):
    week_start: date
    include_open_shifts: bool = True


class AICandidateScoreBreakdown(BaseModel):
    availability_score: float
    skill_match_score: float
    hours_balance_score: float
    rest_margin_score: float
    weekend_balance_score: float
    night_balance_score: float
    preference_score: float


class AICandidateScore(BaseModel):
    employee_id: int
    employee_name: str
    total_score: float
    score_breakdown: AICandidateScoreBreakdown
    flags: List[str] = Field(default_factory=list)


class AIShiftSuggestion(BaseModel):
    shift_id: int
    recommended_employee_id: Optional[int] = None
    recommended_score: Optional[float] = None
    candidates: List[AICandidateScore] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)


class AIUnfilledShift(BaseModel):
    shift_id: int
    reasons: List[str] = Field(default_factory=list)


class AIFairnessSummaryItem(BaseModel):
    employee_id: int
    employee_name: str
    recommended_shift_count: int
    recommended_hours: float


class AIAssignPreviewResponse(BaseModel):
    week_start: date
    scoring_config_used: AIScoringConfigRead
    shift_suggestions: List[AIShiftSuggestion]
    unfilled_shifts: List[AIUnfilledShift]
    fairness_summary: List[AIFairnessSummaryItem]


class AIAssignmentInput(BaseModel):
    shift_id: int
    employee_id: int


class AIAssignApplyRequest(BaseModel):
    week_start: date
    assignments: List[AIAssignmentInput]
    apply_target: str


class AIAssignmentApplied(BaseModel):
    shift_id: int
    employee_id: int


class AIAssignmentRejected(BaseModel):
    shift_id: int
    employee_id: int
    reasons: List[str] = Field(default_factory=list)


class AIAssignApplyResponse(BaseModel):
    applied: List[AIAssignmentApplied]
    rejected: List[AIAssignmentRejected]
