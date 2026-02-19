from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint

from app.db.base import Base

OPEN_SHIFT_MODE_RECOMMEND_ONLY = "RECOMMEND_ONLY"
OPEN_SHIFT_MODE_AUTO_ASSIGN = "AUTO_ASSIGN"


class AIScoringConfig(Base):
    __tablename__ = "ai_scoring_config"
    __table_args__ = (UniqueConstraint("tenant_id", name="uq_ai_scoring_config_tenant"),)

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    availability_weight = Column(Float, nullable=False, default=25.0)
    skill_match_weight = Column(Float, nullable=False, default=25.0)
    hours_balance_weight = Column(Float, nullable=False, default=20.0)
    rest_margin_weight = Column(Float, nullable=False, default=15.0)
    weekend_balance_weight = Column(Float, nullable=False, default=10.0)
    night_balance_weight = Column(Float, nullable=False, default=10.0)
    preference_weight = Column(Float, nullable=False, default=5.0)
    min_score_threshold = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ContractRule(Base):
    __tablename__ = "contract_rules"
    __table_args__ = (UniqueConstraint("tenant_id", name="uq_contract_rules_tenant"),)

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    min_rest_hours = Column(Float, nullable=False, default=11.0)
    max_hours_day = Column(Float, nullable=False, default=12.0)
    max_hours_week = Column(Float, nullable=False, default=48.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class TenantSchedulingSettings(Base):
    __tablename__ = "tenant_scheduling_settings"
    __table_args__ = (UniqueConstraint("tenant_id", name="uq_tenant_scheduling_settings_tenant"),)

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    open_shift_mode = Column(String, nullable=False, default=OPEN_SHIFT_MODE_RECOMMEND_ONLY)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class EmployeePreference(Base):
    __tablename__ = "employee_preferences"
    __table_args__ = (UniqueConstraint("employee_id", name="uq_employee_preferences_employee"),)

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    open_shift_participation_enabled = Column(Boolean, nullable=False, default=True)
    allow_auto_assign_open_shifts = Column(Boolean, nullable=False, default=False)
    preferred_start_hour = Column(Integer, nullable=True)
    preferred_end_hour = Column(Integer, nullable=True)
    secondary_role_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AssignmentAuditLog(Base):
    __tablename__ = "assignment_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String, nullable=False, index=True)
    details = Column(String, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AIFeedbackLoop(Base):
    __tablename__ = "ai_feedback_loop"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False, index=True)
    original_employee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    final_employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    change_reason = Column(String, nullable=True)  # e.g., SKILL_ISSUE, PREFERENCE
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
