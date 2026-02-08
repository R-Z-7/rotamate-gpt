import requests
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models import Company, User, UserRole, Shift
from app.core.security import get_password_hash
from datetime import datetime, timedelta

# Setup DB connection
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

BASE_URL = "http://localhost:8000/api/v1"

def setup_test_data():
    print("Setting up test data...")
    
    # 1. Create Competitor Company
    competitor = db.query(Company).filter(Company.name == "Competitor Corp").first()
    if not competitor:
        competitor = Company(name="Competitor Corp", status="active")
        db.add(competitor)
        db.commit()
        db.refresh(competitor)
        print(f"Created Competitor Corp (ID: {competitor.id})")
    else:
        print(f"Competitor Corp already exists (ID: {competitor.id})")

    # 2. Create Competitor Admin
    comp_admin = db.query(User).filter(User.email == "comp_admin@test.com").first()
    if not comp_admin:
        comp_admin = User(
            email="comp_admin@test.com",
            hashed_password=get_password_hash("password123"),
            full_name="Competitor Admin",
            role=UserRole.ADMIN,
            is_active=True,
            company_id=competitor.id
        )
        db.add(comp_admin)
        db.commit()
        print("Created Competitor Admin")
    else:
        print("Competitor Admin already exists")

    # 3. Create a Shift for Demo Company (ID 1 usually)
    # Assuming Demo Company is ID 1
    demo_company = db.query(Company).filter(Company.name == "Demo Company").first()
    if not demo_company:
        print("CRITICAL: Demo Company not found!")
        sys.exit(1)

    demo_shift = db.query(Shift).filter(Shift.company_id == demo_company.id).first()
    if not demo_shift:
        # Need an employee for demo company
        demo_emp = db.query(User).filter(User.company_id == demo_company.id).first()
        if demo_emp:
            demo_shift = Shift(
                employee_id=demo_emp.id,
                company_id=demo_company.id,
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(hours=8),
                role_type="Manager"
            )
            db.add(demo_shift)
            db.commit()
            print("Created Demo Shift")
        else:
            print("No employee found for Demo Company to create shift")

def login(email, password):
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        if response.status_code != 200:
            print(f"Login failed for {email}: {response.status_code}")
            return None
        return response.json()["access_token"]
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

def verify_isolation():
    print("\n--- Verifying Isolation ---")
    
    # Login as Competitor Admin
    token = login("comp_admin@test.com", "password123")
    if not token:
        print("FAIL: Could not login as Competitor Admin")
        sys.exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to fetch shifts
    print("Fetching shifts as Competitor Admin...")
    response = requests.get(f"{BASE_URL}/shifts/", headers=headers)
    shifts = response.json()
    
    print(f"Found {len(shifts)} shifts.")
    
    # Verify NO shifts from Demo Company are visible
    demo_company = db.query(Company).filter(Company.name == "Demo Company").first()
    
    for shift in shifts:
        if shift.get('company_id') == demo_company.id:
            print(f"FAIL: Competitor Admin sees shift {shift['id']} from Demo Company!")
            sys.exit(1)
            
    print("SUCCESS: Competitor Admin sees only their own company's data (or empty if none).")
    
    # Verify SuperAdmin can see proper data
    print("\n--- Verifying SuperAdmin Access ---")
    sa_token = login("superadmin@rotamate.com", "superadmin123")
    sa_headers = {"Authorization": f"Bearer {sa_token}"}
    
    response = requests.get(f"{BASE_URL}/shifts/", headers=sa_headers)
    sa_shifts = response.json()
    print(f"SuperAdmin sees {len(sa_shifts)} total shifts.")
    
    if len(sa_shifts) > len(shifts):
        print("SUCCESS: SuperAdmin sees more shifts than Competitor Admin.")
    else:
         print("WARNING: SuperAdmin sees same count. Ensure Demo Company has shifts.")

if __name__ == "__main__":
    setup_test_data()
    verify_isolation()
