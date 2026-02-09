from fastapi.testclient import TestClient
from app.db.models import Company
from sqlalchemy.orm import Session

def get_auth_headers(client: TestClient, db: Session, email: str = "admin@example.com", role: str = "admin"):
    # Ensure company exists
    if not db.query(Company).filter(Company.id == 1).first():
        company = Company(id=1, name="Test Company")
        db.add(company)
        db.commit()
    
    # Register/Login helper
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": "Admin User",
            "role": role,
            "company_id": 1,
        },
    )
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
