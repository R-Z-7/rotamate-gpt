from sqlalchemy.orm import Session

from app.db import base  # noqa: F401
from app.db.session import SessionLocal, engine
from app.core.security import get_password_hash
from app.db.models import User, UserRole, Shift, Company
from app.models import ai_scoring  # noqa: F401
from datetime import datetime, timedelta
import random

def init_db(db: Session, seed_demo: bool = False) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create all here
    base.Base.metadata.create_all(bind=engine)
    if not seed_demo:
        return

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
        print("Super Admin created")
    db.flush()

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
        print("Admin user created")
    elif not admin.company_id:
        admin.company_id = company.id
        db.add(admin)
        print("Admin user linked to demo company")
    db.flush()

    # 4. Create Employee Users (Linked to Demo Company)
    employee_data = [
        {"email": "employee@rotamate.com", "name": "John Doe", "role": UserRole.EMPLOYEE, "pass": "employee123"},
        {"email": "jane@example.com", "name": "Jane Smith", "role": UserRole.EMPLOYEE, "pass": "password123"},
        {"email": "mike@example.com", "name": "Mike Ross", "role": UserRole.EMPLOYEE, "pass": "password123"},
        {"email": "sarah@example.com", "name": "Sarah Connor", "role": UserRole.ADMIN, "pass": "password123"},
    ]

    for data in employee_data:
        emp = db.query(User).filter(User.email == data["email"]).first()
        if not emp:
            emp = User(
                email=data["email"],
                hashed_password=get_password_hash(data["pass"]),
                full_name=data["name"],
                role=data["role"],
                is_active=True,
                company_id=company.id
            )
            db.add(emp)
            db.flush()
            print(f"User {data['name']} created")
        else:
            # Ensure company link if missing
            if not emp.company_id:
                emp.company_id = company.id
                db.add(emp)
                db.flush()
                print(f"User {data['name']} linked to demo company")
        
        # Create demo shift for each new employee
        shift = db.query(Shift).filter(Shift.employee_id == emp.id).first()
        if not shift:
            shift = Shift(
                employee_id=emp.id,
                company_id=company.id,
                start_time=datetime.utcnow() + timedelta(days=random.randint(1, 5), hours=random.randint(8, 14)),
                end_time=datetime.utcnow() + timedelta(days=1, hours=random.randint(17, 22)),
                role_type="Staff",
                status="assigned"
            )
            db.add(shift)

    db.commit()

if __name__ == "__main__":
    print("Creating initial data")
    db = SessionLocal()
    init_db(db, seed_demo=True)
    print("Initial data created")
