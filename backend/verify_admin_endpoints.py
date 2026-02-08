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

def verify_admin_access():
    print("Attempting login as admin@rotamate.com...")
    token = login("admin@rotamate.com", "admin123")
    print("Login successful.")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Fetch /users (Employees page)
    print("Fetching /users/...")
    response = requests.get(f"{BASE_URL}/users/", headers=headers)
    if response.status_code != 200:
        print(f"FAIL: Failed to fetch users: {response.status_code} - {response.text}")
    else:
        print(f"SUCCESS: Fetched {len(response.json())} users.")

    # 2. Fetch /shifts (Rota page)
    print("Fetching /shifts/...")
    response = requests.get(f"{BASE_URL}/shifts/", headers=headers)
    if response.status_code != 200:
        print(f"FAIL: Failed to fetch shifts: {response.status_code} - {response.text}")
    else:
        print(f"SUCCESS: Fetched {len(response.json())} shifts.")

    # 3. Check /users/me
    print("Fetching /users/me...")
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    user = response.json()
    print(f"User Company ID: {user.get('company_id')}")

if __name__ == "__main__":
    verify_admin_access()
