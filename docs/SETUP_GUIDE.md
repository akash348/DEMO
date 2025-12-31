# Pragati Institute - Local Setup Guide

This guide records the exact step-by-step commands used to run the backend, frontend, and admin panel.

---
## 1) Backend (FastAPI)
Run these commands from PowerShell:

1) Go to backend folder
```
cd d:\pragati\backend
```

2) Create virtual environment
```
python -m venv .venv
```

3) Activate virtual environment
```
.\.venv\Scripts\Activate.ps1
```

4) Install dependencies
```
pip install -r requirements.txt
```

5) Create `.env`
```
copy .env.example .env
```

6) Create database tables
```
python -c "from app.db.init_db import init_db; init_db()"
```

Note: If you already have `pragati.db` from an older version, delete it first so new tables
(trades, exams, student login fields) are created, then run the init command again.

7) Start backend (use port 8001 if 8000 is blocked)
```
uvicorn app.main:app --reload --app-dir . --host 127.0.0.1 --port 8001
```

8) Test in browser
- API health: `http://localhost:8001`
- API docs: `http://localhost:8001/docs`

9) Create admin user (Swagger UI)
- Open `http://localhost:8001/docs`
- Use `POST /api/v1/auth/register` with this JSON:
```
{
  "name": "Admin",
  "email": "admin@pragati.in",
  "password": "ChangeMe123",
  "role": "admin",
  "is_active": true
}
```

---
## 2) Frontend (Public Website)
Open a new terminal:

1) Go to frontend folder
```
cd d:\pragati\frontend
```

2) Create `.env`
```
copy .env.example .env
```

3) Point frontend to backend (port 8001)
```
@'
VITE_API_BASE_URL="http://localhost:8001/api/v1"
'@ | Set-Content -Encoding ASCII .env
```

4) Install dependencies
```
npm install
```

5) Start dev server
```
npm run dev
```

6) Open in browser
- `http://localhost:5173`

---
## 3) Admin Panel
Open another terminal:

1) Go to admin folder
```
cd d:\pragati\admin
```

2) Create `.env`
```
copy .env.example .env
```

3) Point admin to backend (port 8001)
```
@'
VITE_API_BASE_URL="http://localhost:8001/api/v1"
'@ | Set-Content -Encoding ASCII .env
```

4) Install dependencies
```
npm install
```

5) Start dev server
```
npm run dev
```

6) Open admin login
- `http://localhost:5174/admin/login`
- Login with the admin user created in step 1

---
## 4) Student Portal (Optional)
Student login works in two ways:
- Admin sets a password in the Students page ("Set Login").
- Student enables login once using enrollment number + DOB.

Open student portal:
- `http://localhost:5173/student/login`

---
## 5) Where Data is Stored (SQLite)
Default database file:
- If backend started from `d:\pragati\backend`: `d:\pragati\backend\pragati.db`
- If backend started from `d:\pragati`: `d:\pragati\pragati.db`

---
## 6) Key Files (Config + Entry Points)
- Backend entry: `backend/app/main.py`
- Backend env: `backend/.env`
- Backend deps: `backend/requirements.txt`
- DB init: `backend/app/db/init_db.py`
- Frontend env: `frontend/.env`
- Frontend API base: `frontend/src/api/client.js`
- Student API base: `frontend/src/api/studentClient.js`
- Admin env: `admin/.env`
- Admin API base: `admin/src/api/client.js`
- Admin auth: `admin/src/utils/auth.js`
