from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from uuid import uuid4

from app.core.security import get_password_hash
from app.db.models import Company, User
from sqlalchemy.orm import Session

def get_auth_headers(client: TestClient, db: Session, email: str = "shiftadmin@example.com"):
    # Ensure company exists
    if not db.query(Company).filter(Company.id == 1).first():
        company = Company(id=1, name="Test Company")
        db.add(company)
        db.flush()
    else:
        company = db.query(Company).filter(Company.id == 1).first()

    existing_user = db.query(User).filter(User.email == email).first()
    if not existing_user:
        existing_user = User(
            email=email,
            hashed_password=get_password_hash("password123"),
            full_name="Shift Admin",
            role="admin",
            company_id=company.id,
            is_active=True,
        )
        db.add(existing_user)
    else:
        existing_user.hashed_password = get_password_hash("password123")
        existing_user.role = "admin"
        existing_user.company_id = company.id
        existing_user.is_active = True
        db.add(existing_user)
    db.commit()
    
    # Login helper
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"},
    )
    token = response.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

def create_employee(client: TestClient, headers):
    email = f"shiftworker-{uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/v1/users/",
        headers=headers,
        json={
            "email": email,
            "password": "pass",
            "full_name": "Worker",
            "role": "employee",
            "company_id": 1
        }
    )
    return res.json()["id"]

def test_create_shift(client: TestClient, db_session: Session):
    headers = get_auth_headers(client, db_session)
    emp_id = create_employee(client, headers)
    
    start = datetime.utcnow() + timedelta(days=1)
    end = start + timedelta(hours=8)
    
    response = client.post(
        "/api/v1/shifts/",
        headers=headers,
        json={
            "employee_id": emp_id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "role_type": "Nurse",
            "status": "assigned"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role_type"] == "Nurse"
    assert data["employee_id"] == emp_id

def test_ai_rota_generation_stub(client: TestClient, db_session: Session):
    headers = get_auth_headers(client, db_session, email="aiadmin@example.com")
    create_employee(client, headers)
    response = client.post(
        "/api/v1/ai/suggest_schedule",
        headers=headers,
        json={
            "start_date": "2026-03-01",
            "end_date": "2026-03-07",
            "company_id": 1,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "shifts" in data
    assert isinstance(data["shifts"], list)
