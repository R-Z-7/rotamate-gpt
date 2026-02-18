from datetime import datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.models import Availability, Company, Shift, User
from app.models.ai_scoring import AssignmentAuditLog


def get_auth_headers(client: TestClient, db: Session, email: str) -> dict:
    company = db.query(Company).filter(Company.id == 1).first()
    if not company:
        company = Company(id=1, name="AI Test Company", status="active")
        db.add(company)
        db.flush()

    admin = db.query(User).filter(User.email == email).first()
    if not admin:
        admin = User(
            email=email,
            hashed_password=get_password_hash("password123"),
            full_name="AI Admin",
            role="admin",
            company_id=company.id,
            is_active=True,
        )
        db.add(admin)
    else:
        admin.hashed_password = get_password_hash("password123")
        admin.role = "admin"
        admin.company_id = company.id
        admin.is_active = True
        db.add(admin)
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_employee(db: Session, company_id: int, *, available: bool = True) -> User:
    employee = User(
        email=f"ai-worker-{uuid4().hex[:8]}@example.com",
        hashed_password=get_password_hash("password123"),
        full_name=f"Worker {uuid4().hex[:4]}",
        role="employee",
        company_id=company_id,
        is_active=True,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    availability = Availability(
        company_id=company_id,
        employee_id=employee.id,
        date=datetime.utcnow(),
        is_available=available,
        reason=None if available else "Not available",
    )
    db.add(availability)
    db.commit()
    return employee


def test_ai_assign_preview_returns_ranked_candidates(client: TestClient, db_session: Session):
    headers = get_auth_headers(client, db_session, email="ai-preview-admin@example.com")
    company = db_session.query(Company).filter(Company.id == 1).first()
    assert company is not None

    eligible_employee = create_employee(db_session, company.id, available=True)
    _ = create_employee(db_session, company.id, available=False)

    start = datetime.utcnow() + timedelta(days=2)
    end = start + timedelta(hours=8)
    shift = Shift(
        company_id=company.id,
        employee_id=None,
        start_time=start,
        end_time=end,
        role_type="Nurse",
        status="assigned",
    )
    db_session.add(shift)
    db_session.commit()
    db_session.refresh(shift)

    week_start = (start.date() - timedelta(days=start.weekday())).isoformat()
    response = client.post(
        "/api/v1/ai/assign/preview",
        headers=headers,
        json={"week_start": week_start, "include_open_shifts": True},
    )
    assert response.status_code == 200
    data = response.json()

    suggestions = {item["shift_id"]: item for item in data["shift_suggestions"]}
    assert shift.id in suggestions
    suggestion = suggestions[shift.id]
    assert suggestion["recommended_employee_id"] == eligible_employee.id
    assert len(suggestion["candidates"]) >= 1
    assert "score_breakdown" in suggestion["candidates"][0]


def test_ai_assign_apply_writes_to_draft_and_audits(client: TestClient, db_session: Session):
    headers = get_auth_headers(client, db_session, email="ai-apply-admin@example.com")
    company = db_session.query(Company).filter(Company.id == 1).first()
    assert company is not None

    employee = create_employee(db_session, company.id, available=True)
    start = datetime.utcnow() + timedelta(days=3)
    end = start + timedelta(hours=8)
    shift = Shift(
        company_id=company.id,
        employee_id=None,
        start_time=start,
        end_time=end,
        role_type="Nurse",
        status="assigned",
    )
    db_session.add(shift)
    db_session.commit()
    db_session.refresh(shift)

    week_start = (start.date() - timedelta(days=start.weekday())).isoformat()
    response = client.post(
        "/api/v1/ai/assign/apply",
        headers=headers,
        json={
            "week_start": week_start,
            "apply_target": "DRAFT",
            "assignments": [{"shift_id": shift.id, "employee_id": employee.id}],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["applied"]) == 1
    assert data["applied"][0]["shift_id"] == shift.id

    updated_shift = db_session.query(Shift).filter(Shift.id == shift.id).first()
    assert updated_shift is not None
    assert updated_shift.employee_id == employee.id
    assert updated_shift.status == "draft"

    audit = (
        db_session.query(AssignmentAuditLog)
        .filter(
            AssignmentAuditLog.shift_id == shift.id,
            AssignmentAuditLog.employee_id == employee.id,
            AssignmentAuditLog.action == "AI_ASSIGNMENT_APPLIED",
        )
        .first()
    )
    assert audit is not None


def test_ai_scoring_settings_get_and_put(client: TestClient, db_session: Session):
    headers = get_auth_headers(client, db_session, email="ai-settings-admin@example.com")

    get_response = client.get("/api/v1/settings/ai-scoring", headers=headers)
    assert get_response.status_code == 200
    initial = get_response.json()
    assert initial["availability_weight"] == 25.0

    put_response = client.put(
        "/api/v1/settings/ai-scoring",
        headers=headers,
        json={
            "availability_weight": 30,
            "skill_match_weight": 28,
            "min_score_threshold": 40,
        },
    )
    assert put_response.status_code == 200
    updated = put_response.json()
    assert updated["availability_weight"] == 30.0
    assert updated["skill_match_weight"] == 28.0
    assert updated["min_score_threshold"] == 40.0
