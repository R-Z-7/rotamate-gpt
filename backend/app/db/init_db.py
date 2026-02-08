from sqlalchemy.orm import Session

from app.db import base  # noqa: F401
from app.db.session import SessionLocal, engine
from app.core.security import get_password_hash
from app.db.models import User, UserRole, Shift
from datetime import datetime, timedelta

def init_db(db: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create all here
    base.Base.metadata.create_all(bind=engine)

    user = db.query(User).filter(User.email == "admin@rotamate.com").first()
    if not user:
        user = User(
            email="admin@rotamate.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin User",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(user)
        db.flush() 
        print("Admin user created")

    employee = db.query(User).filter(User.email == "employee@rotamate.com").first()
    if not employee:
        employee = User(
            email="employee@rotamate.com",
            hashed_password=get_password_hash("employee123"),
            full_name="John Doe",
            role=UserRole.EMPLOYEE,
            is_active=True,
        )
        db.add(employee)
        db.flush()
        print("Employee user created")

        # Create demo shift
        shift = Shift(
            employee_id=employee.id,
            start_time=datetime.utcnow() + timedelta(days=1, hours=9),
            end_time=datetime.utcnow() + timedelta(days=1, hours=17),
            role_type="Nurse",
            status="assigned"
        )
        db.add(shift)

    db.commit()

if __name__ == "__main__":
    print("Creating initial data")
    db = SessionLocal()
    init_db(db)
    print("Initial data created")
