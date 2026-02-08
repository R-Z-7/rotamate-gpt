import requests
import json
from datetime import datetime, timedelta

def test_ai_generation():
    url = "http://localhost:8000/api/v1/ai/generate"
    # Authenticate first (mocking logic or using a known token if needed, 
    # but the stub might be protected. Let's get a token.)
    
    # Login
    auth_response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        data={"username": "admin@rotamate.com", "password": "admin123"}
    )
    if auth_response.status_code != 200:
        print("Failed to login:", auth_response.text)
        return

    token = auth_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "start_date": "2026-03-01",
        "end_date": "2026-03-07",
        "employee_ids": [1],
        "shifts_per_day": 2
    }

    print(f"Sending request to {url} with payload: {payload}")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("Error:", response.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_ai_generation()
