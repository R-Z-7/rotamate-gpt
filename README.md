# RotaMate

RotaMate is a modern SaaS web application for workforce scheduling.

## Features

- **Admin Dashboard**: Manage shifts, employees, and view reports.
- **Employee Portal**: View schedule, submit availability, and request time off.
- **AI Integration**: Stub for AI-driven rota generation.

## Getting Started

### Backend

1. Navigate to `backend/`.
2. Create virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

4. Initialize Database with Demo Data:
   ```bash
   python -m app.db.init_db
   ```
   *(This creates `rotamate.db` SQLite file locally)*

4. Run Server:
   ```bash
   uvicorn app.main:app --reload
   ```
   API will be available at `http://localhost:8000`.

### Frontend

1. Navigate to `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment:
   ```bash
   cp .env.example .env.local
   ```
4. Run Development Server:
   ```bash
   npm run dev
   ```
   App will be available at `http://localhost:3000`.

## Credentials

- **Admin**: `admin@rotamate.com` / `admin123`
- **Employee**: `employee@rotamate.com` / `employee123`

## Tech Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, SQLite (Dev)
