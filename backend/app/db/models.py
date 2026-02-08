from sqlalchemy import Boolean, Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    
    shifts = relationship("Shift", back_populates="employee")
    time_off_requests = relationship("TimeOffRequest", back_populates="employee")
    availabilities = relationship("Availability", back_populates="employee")

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    role_type = Column(String)  # e.g., Nurse, HCA
    status = Column(String, default="assigned") # assigned, open
    
    employee = relationship("User", back_populates="shifts")

class TimeOffRequest(Base):
    __tablename__ = "time_off_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(String)
    status = Column(String, default="pending") # pending, approved, rejected
    
    employee = relationship("User", back_populates="time_off_requests")

class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, nullable=False)
    is_available = Column(Boolean, default=True)
    reason = Column(String, nullable=True) # e.g. "Preferred" or "Not Available"
    
    employee = relationship("User", back_populates="availabilities")
