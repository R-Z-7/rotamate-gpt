from fastapi.testclient import TestClient

def test_register_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "password123",
            "full_name": "Test User",
            "role": "employee",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert "id" in data

def test_login_access_token(client: TestClient):
    # First ensure user exists (might be redundant if order is guaranteed or state refreshed, 
    # but let's register again if db is fresh per module)
    # Our fixture resets DB per module
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "password": "password123",
            "full_name": "Login User",
            "role": "employee",
        },
    )
    
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "loginuser@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
