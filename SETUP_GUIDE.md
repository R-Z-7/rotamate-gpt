# RotaMate Setup Guide

Follow these steps to get the RotaMate project running on your local machine.

## Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.9 or higher)
- **Git**

## 1. Get the Code

Clone the repository to your local machine:
```bash
git clone <repository-url>
cd rotamate
```

---

## 2. Backend Setup (FastAPI)

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create a virtual environment:
    ```bash
    python3 -m venv venv
    ```

3.  Activate the virtual environment:
    - **Mac/Linux:**
        ```bash
        source venv/bin/activate
        ```
    - **Windows:**
        ```bash
        .\venv\Scripts\activate
        ```

4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

5.  Set up environment variables:
    ```bash
    cp .env.example .env
    ```
    *(The default configuration uses SQLite, so no extra database setup is needed unless you want to use PostgreSQL)*

6.  Initialize the database with demo data:
    ```bash
    python -m app.db.init_db
    ```
    This will create `rotamate.db` and seed it with a Super Admin, Admin, and Employee user.

7.  Run the backend server:
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

---

## 3. Frontend Setup (Next.js)

1.  Open a new terminal window and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    ```bash
    cp .env.example .env.local
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

---

## 4. Accessing the Application

Open your browser and navigate to `http://localhost:3000`.

### Default Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@rotamate.com` | `superadmin123` |
| **Admin** | `admin@rotamate.com` | `admin123` |
| **Employee** | `employee@rotamate.com` | `employee123` |

### Key Features to Check
- **Super Admin Dashboard:** Manage companies and billing.
- **Admin Dashboard:** Manage schedules, time-off requests, and view reports.
- **Employee Portal:** View personal rota and request time off.

Happy coding! 🚀
