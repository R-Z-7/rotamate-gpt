from sqlalchemy.orm import Session

from app.db import base  # noqa: F401
from app.db.session import SessionLocal, engine
from app.core.security import get_password_hash
from app.db.models import User, UserRole, Shift, Company
from datetime import datetime, timedelta

def init_db(db: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create all here
    base.Base.metadata.create_all(bind=engine)

    # 1. Create Demo Company
    company = db.query(Company).filter(Company.name == "Demo Company").first()
    if not company:
        company = Company(name="Demo Company", status="active")
        db.add(company)
        db.flush()
        print("Demo Company created")

    # 2. Create Super Admin
    super_admin = db.query(User).filter(User.email == "superadmin@rotamate.com").first()
    if not super_admin:
        super_admin = User(
            email="superadmin@rotamate.com",
            hashed_password=get_password_hash("superadmin123"),
            full_name="Super Admin",
            role=UserRole.SUPERADMIN,
            is_active=True,
            # SuperAdmin might not need a company, or could belong to a system company
        )
        db.add(super_admin)
        db.flush()
        print("Super Admin created")

    # 3. Create Admin User (Linked to Demo Company)
    admin = db.query(User).filter(User.email == "admin@rotamate.com").first()
    if not admin:
        admin = User(
            email="admin@rotamate.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin User",
            role=UserRole.ADMIN,
            is_active=True,
            company_id=company.id
        )
        db.add(admin)
        db.flush() 
        print("Admin user created")
    else:
        # Update existing admin to link to company if not already
        if not admin.company_id:
            admin.company_id = company.id
            db.add(admin)
            print("Admin user linked to company")

    # 4. Create Employee User (Linked to Demo Company)
    employee = db.query(User).filter(User.email == "employee@rotamate.com").first()
    if not employee:
        employee = User(
            email="employee@rotamate.com",
            hashed_password=get_password_hash("employee123"),
            full_name="John Doe",
            role=UserRole.EMPLOYEE,
            is_active=True,
            company_id=company.id
        )
        db.add(employee)
        db.flush()
        print("Employee user created")
    else:
        if not employee.company_id:
            employee.company_id = company.id
            db.add(employee)
            print("Employee user linked to company")

        # Create demo shift linked to company
        shift = db.query(Shift).filter(Shift.employee_id == employee.id).first()
        if not shift:
            shift = Shift(
                employee_id=employee.id,
                company_id=company.id,
                start_time=datetime.utcnow() + timedelta(days=1, hours=9),
                end_time=datetime.utcnow() + timedelta(days=1, hours=17),
                role_type="Nurse",
                status="assigned"
            )
            db.add(shift)
        else:
            if not shift.company_id:
                shift.company_id = company.id
                db.add(shift)

    db.commit()

if __name__ == "__main__":
    print("Creating initial data")
    db = SessionLocal()
    init_db(db)
    print("Initial data created")
