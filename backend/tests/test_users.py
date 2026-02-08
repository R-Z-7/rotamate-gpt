from fastapi.testclient import TestClient

def get_auth_headers(client: TestClient, email: str = "admin@example.com", role: str = "admin"):
    # Register/Login helper
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": "Admin User",
            "role": role,
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_user_as_admin(client: TestClient):
    headers = get_auth_headers(client)
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

def test_read_users_me(client: TestClient):
    headers = get_auth_headers(client, email="me@example.com", role="employee")
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
