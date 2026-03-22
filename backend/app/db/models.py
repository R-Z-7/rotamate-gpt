from sqlalchemy import Boolean, Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import Base

class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    EMPLOYEE = "employee"

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="active") # active, suspended
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="company")
    shifts = relationship("Shift", back_populates="company")
    time_off_requests = relationship("TimeOffRequest", back_populates="company")
    availabilities = relationship("Availability", back_populates="company")
    notifications = relationship("Notification", back_populates="company")
    shift_overrides = relationship("ShiftOverrideRequest", back_populates="company")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True) # Nullable for SuperAdmin or ease of migration
    
    company = relationship("Company", back_populates="users")
    shifts = relationship("Shift", back_populates="employee")
    time_off_requests = relationship("TimeOffRequest", back_populates="employee")
    availabilities = relationship("Availability", back_populates="employee")
    notifications = relationship("Notification", back_populates="user")
    shift_overrides = relationship("ShiftOverrideRequest", back_populates="employee")

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    role_type = Column(String)  # e.g., Nurse, HCA
    status = Column(String, default="assigned") # assigned, open
    
    company = relationship("Company", back_populates="shifts")
    employee = relationship("User", back_populates="shifts")
    override_request = relationship("ShiftOverrideRequest", back_populates="shift", uselist=False)

class ShiftOverrideRequest(Base):
    __tablename__ = "shift_override_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"))
    employee_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, acknowledged, change_requested, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="shift_overrides")
    shift = relationship("Shift", back_populates="override_request")
    employee = relationship("User", back_populates="shift_overrides")

class TimeOffRequest(Base):
    __tablename__ = "time_off_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(String)
    status = Column(String, default="pending") # pending, approved, rejected
    
    company = relationship("Company", back_populates="time_off_requests")
    employee = relationship("User", back_populates="time_off_requests")

class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, nullable=False)
    is_available = Column(Boolean, default=True)
    reason = Column(String, nullable=True) # e.g. "Preferred" or "Not Available"
    is_recurring = Column(Boolean, default=False)
    day_of_week = Column(Integer, nullable=True) # 0=Monday, 6=Sunday
    
    company = relationship("Company", back_populates="availabilities")
    employee = relationship("User", back_populates="availabilities")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String)
    type = Column(String, default="info") # info, warning, success
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="notifications")
    user = relationship("User", back_populates="notifications")

class AutomationConfig(Base):
    __tablename__ = "automation_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False, unique=True)
    is_enabled = Column(Boolean, default=False)
    schedule_type = Column(String, default="weekly") # weekly, monthly
    run_day_of_week = Column(Integer, default=0) # 0=Monday
    run_time = Column(String, default="00:00") # HH:MM
    convert_to_open_shifts = Column(Boolean, default=True)


# Ensure AI scheduling tables are registered in shared metadata.
from app.models.ai_scoring import (  # noqa: E402,F401
    AIScoringConfig,
    AssignmentAuditLog,
    ContractRule,
    EmployeePreference,
    TenantSchedulingSettings,
)
