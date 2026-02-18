from fastapi.testclient import TestClient
from app.core.security import get_password_hash
from app.db.models import Company, User
from sqlalchemy.orm import Session

def get_auth_headers(client: TestClient, db: Session, email: str = "admin@example.com", role: str = "admin"):
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
            full_name="Admin User",
            role=role,
            company_id=company.id,
            is_active=True,
        )
        db.add(existing_user)
    else:
        existing_user.hashed_password = get_password_hash("password123")
        existing_user.role = role
        existing_user.company_id = company.id
        existing_user.is_active = True
        db.add(existing_user)
    db.commit()
    
    # Login helper
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_user_as_admin(client: TestClient, db_session: Session):
    headers = get_auth_headers(client, db_session)
    response = client.post(
        "/api/v1/users/",
        headers=headers,
        json={
            "email": "newemployee@example.com",
            "password": "password123",
            "full_name": "New Employee",
            "role": "employee",
        },
    )
    assert response.status_code == 200
    assert response.json()["email"] == "newemployee@example.com"

def test_read_users_me(client: TestClient, db_session: Session):
    headers = get_auth_headers(client, db_session, email="me@example.com", role="employee")
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
