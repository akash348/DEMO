# Pragati Institute Management System

This repo includes:
- Public website (React)
- Admin panel (React)
- Backend APIs (FastAPI + SQLAlchemy)
- Student portal (React) for exams + login

## Project Structure
```
frontend/   # Public website
admin/      # Admin panel
backend/    # FastAPI backend
```

## Backend (FastAPI)
1) Create virtual environment
```
python -m venv .venv
.venv\Scripts\activate
```

2) Install dependencies
```
pip install -r backend\requirements.txt
```

3) Configure env
```
copy backend\.env.example backend\.env
```
Update `SQLALCHEMY_DATABASE_URI` if needed.

4) Run API
```
uvicorn app.main:app --reload --app-dir backend --port 8001
```

5) Create an admin user
```
POST http://localhost:8000/api/v1/auth/register
```
Example body:
```
{
  "name": "Admin",
  "email": "admin@pragati.in",
  "password": "ChangeMe123",
  "role": "admin",
  "is_active": true
}
```

## Frontend (Public Website)
```
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Admin Panel
```
cd admin
copy .env.example .env
npm install
npm run dev
```

Open the admin at `http://localhost:5174/admin/login` and sign in with the admin user you created.

## Notes
- Default DB is SQLite. For MySQL/Postgres, update the DB URI and install the driver.
- Auth uses JWT. Protected routes require `Authorization: Bearer <token>`.
- Public endpoints: `courses`, `gallery`, `enquiries`, `certificates/verify`.
- Student endpoints: `student-auth`, `exams/student`.
- Admin UI reads the API base URL from `VITE_API_BASE_URL`.

## Production Checklist
- Update `backend/.env`:
  - `SECRET_KEY` (strong value)
  - `SQLALCHEMY_DATABASE_URI` (MySQL/Postgres recommended)
  - `CORS_ORIGINS` (your public domains)
  - `MEDIA_MAX_SIZE_MB` (upload size limit)
- Build frontends:
```
cd frontend
npm run build
cd ..\admin
npm run build
```
- Run backend without `--reload` and behind a reverse proxy.

## Next Enhancements
- Online admission
- Payment gateway integration
- Attendance tracking
