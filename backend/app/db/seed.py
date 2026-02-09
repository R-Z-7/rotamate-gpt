from sqlalchemy.orm import Session
from app.db.models import User, Shift, TimeOffRequest, Notification, UserRole, Company, Availability
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random

def create_employees(db: Session, company_id: int):
    roles = [
        UserRole.ADMIN,
        UserRole.EMPLOYEE, UserRole.EMPLOYEE, UserRole.EMPLOYEE, UserRole.EMPLOYEE,
        UserRole.EMPLOYEE, UserRole.EMPLOYEE, UserRole.EMPLOYEE, UserRole.EMPLOYEE,
        UserRole.EMPLOYEE, UserRole.EMPLOYEE, UserRole.EMPLOYEE
    ]
    
    titles = ["Manager", "Supervisor", "Chef", "Sous Chef", "Waiter", "Waitress", "Bartender", "Barista", "Cleaner", "Receptionist", "Security", "Kitchen Porter"]
    
    names = [
        "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Evan Wright",
        "Fiona Green", "George King", "Hannah White", "Ian Black", "Julia Roberts",
        "Kevin Hart", "Laura Croft"
    ]
    
    employees = []
    
    for i, name in enumerate(names):
        email_prefix = name.lower().replace(" ", ".")
        email = f"{email_prefix}@example.com"
        
        # Check if user exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            employees.append(existing)
            continue
            
        user = User(
            full_name=name,
            email=email,
            hashed_password=get_password_hash("password"),
            role=roles[i],
            company_id=company_id,
            is_active=True
        )
        db.add(user)
        employees.append(user)
    
    db.commit()
    for e in employees:
        db.refresh(e)
        
    return employees

def create_shifts(db: Session, employees: list, company_id: int):
    # Create shifts for current week and next week
    today = datetime.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    
    shifts = []
    
    for week_offset in range(2): # 0 = this week, 1 = next week
        week_start = start_of_week + timedelta(weeks=week_offset)
        
        for day_offset in range(7): # Mon-Sun
            current_day = week_start + timedelta(days=day_offset)
            
            # Randomly assign shifts to fewer employees per day
            daily_staff = random.sample(employees, k=random.randint(4, 8))
            
            for emp in daily_staff:
                # Random shift types
                shift_type = random.choice(["morning", "evening", "night"])
                
                if shift_type == "morning":
                    start = datetime.combine(current_day, datetime.strptime("08:00", "%H:%M").time())
                    end = datetime.combine(current_day, datetime.strptime("16:00", "%H:%M").time())
                elif shift_type == "evening":
                    start = datetime.combine(current_day, datetime.strptime("16:00", "%H:%M").time())
                    end = datetime.combine(current_day, datetime.strptime("23:59", "%H:%M").time()) # Approximate
                else:
                    start = datetime.combine(current_day, datetime.strptime("23:00", "%H:%M").time())
                    end = datetime.combine(current_day + timedelta(days=1), datetime.strptime("07:00", "%H:%M").time())
                
                shift = Shift(
                    company_id=company_id,
                    employee_id=emp.id,
                    start_time=start,
                    end_time=end,
                    role_type=random.choice(["General", "Supervisor", "Support"]),
                    status="assigned"
                )
                db.add(shift)
    
    db.commit()

def create_time_off(db: Session, employees: list, company_id: int):
    statuses = ["pending", "approved", "rejected"]
    reasons = ["Vacation", "Sick Leave", "Personal", "Family Emergency"]
    
    for _ in range(10):
        emp = random.choice(employees)
        today = datetime.now()
        start = today + timedelta(days=random.randint(1, 30))
        end = start + timedelta(days=random.randint(1, 5))
        
        req = TimeOffRequest(
            company_id=company_id,
            employee_id=emp.id,
            start_date=start,
            end_date=end,
            reason=random.choice(reasons),
            status=random.choice(statuses)
        )
        db.add(req)
        
    db.commit()

def seed_db(db: Session):
    # 1. Create Company
    company = db.query(Company).filter(Company.name == "Demo Corp").first()
    if not company:
        company = Company(name="Demo Corp", status="active")
        db.add(company)
        db.commit()
        db.refresh(company)
    
    print(f"Seeding data for company: {company.name} (ID: {company.id})")
    
    # 2. Create Employees
    employees = create_employees(db, company.id)
    print(f"Created/Found {len(employees)} employees")
    
    # 3. Create Shifts
    create_shifts(db, employees, company.id)
    print("Created shifts for this week and next week")
    
    # 4. Create Time Off
    create_time_off(db, employees, company.id)
    print("Created time off requests")
    
    # 5. Notifications (Simple)
    admin = next((e for e in employees if e.role == UserRole.ADMIN), employees[0])
    
    notif = Notification(
        company_id=company.id,
        user_id=admin.id,
        title="Welcome to Demo Mode",
        description="The system has been populated with demo data.",
        type="info",
        is_read=False
    )
    db.add(notif)
    db.commit()
    print("Created welcome notification")

    print("✅ Database seeding complete!")
