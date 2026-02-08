import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            sys.exit(1)
        return response.json()["access_token"]
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

def verify_superadmin():
    print("Attempting login as superadmin@rotamate.com...")
    token = login("superadmin@rotamate.com", "superadmin123")
    print("Login successful. Token received.")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Fetching /users/me...")
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch user: {response.status_code} - {response.text}")
        sys.exit(1)
        
    user = response.json()
    print(f"User Data: {user}")
    
    if user["role"] != "superadmin":
        print(f"FAIL: Expected role 'superadmin', got '{user['role']}'")
        sys.exit(1)
        
    print("SUCCESS: User Role is 'superadmin'. This confirms the frontend will redirect to /superadmin/dashboard.")

if __name__ == "__main__":
    verify_superadmin()
