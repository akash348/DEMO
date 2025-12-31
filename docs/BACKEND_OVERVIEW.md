# Pragati Backend Overview (Hinglish)

Ye document backend ka simple explain hai: kya files hain, kaise link hota hai, aur flow kaise chalta hai.

---
## 1) Entry Point aur App Boot

- File: `backend/app/main.py`
  - FastAPI app create hota hai.
  - `init_db()` startup par call hota hai (tables create).
  - `/uploads` static mount hota hai, jisse images/videos serve hote hain.
  - CORS config `settings.CORS_ORIGINS` se load hota hai.
  - All routes `app.include_router(api_router, prefix="/api/v1")` se attach hote hain.

---
## 2) Config (Environment)

- File: `backend/app/core/config.py`
  - `SQLALCHEMY_DATABASE_URI` DB connection string.
  - `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ALGORITHM` -> JWT auth.
  - `CORS_ORIGINS` -> frontend/admin URLs allow list.
  - `MEDIA_MAX_SIZE_MB` -> upload size limit.

Env file: `backend/.env` (example: `backend/.env.example`)

---
## 3) Database Layer

- File: `backend/app/db/session.py` -> SQLAlchemy engine + session.
- File: `backend/app/db/base.py` -> `Base` model.
- File: `backend/app/db/init_db.py` -> `Base.metadata.create_all()`.
- File: `backend/app/db/migrate.py` -> existing DB ke liye missing columns add karta hai.

SQLite default:
- `backend/pragati.db` (jab backend `d:\pragati\backend` se run hota hai)

---
## 4) Auth System (Admin + Student)

### Admin Auth
- Routes: `backend/app/api/v1/routes/auth.py`
- Flow:
  1. `/api/v1/auth/register` -> admin user create.
  2. `/api/v1/auth/login` -> JWT token.
  3. Protected routes require `Authorization: Bearer <token>`.

### Student Auth
- Routes: `backend/app/api/v1/routes/student_auth.py`
- Flow:
  1. `/api/v1/student-auth/register` -> enrollment_no + dob se password set (login enable).
  2. `/api/v1/student-auth/login` -> JWT token.
  3. Token subject `student:<id>` format me hota hai.

Auth helpers:
- File: `backend/app/api/deps.py`
  - `get_current_user()` -> admin token check.
  - `get_current_student()` -> student token check.
- File: `backend/app/core/security.py` -> password hash + JWT encode/decode.

---
## 5) Models + Schemas Link

Pattern:
- Models: `backend/app/models/*.py` (DB tables)
- Schemas: `backend/app/schemas/*.py` (API request/response format)
- Routes: `backend/app/api/v1/routes/*.py` (CRUD)

Example:
- `models/course.py` -> table `courses`
- `schemas/course.py` -> `CourseCreate`, `CourseOut`
- `routes/courses.py` -> `/api/v1/courses` endpoints

---
## 6) Core Modules (Routes)

### Trades + Courses
- `routes/trades.py` -> Trade CRUD
- `routes/courses.py` -> Course CRUD
- Relation: `courses.trade_id` -> `trades.id` (one trade, many courses)

### Students
- `routes/students.py` -> student CRUD + photo upload + set login password
- Photo upload: `/api/v1/students/upload` (multipart)
- Photo update: `/api/v1/students/{id}/photo`

### Fees + Expenses
- `routes/fees.py` -> fees CRUD (admin protected)
- `routes/expenses.py` -> expense CRUD (admin protected)

### Certificates + Verification
- `routes/certificates.py`
  - Admin: create/update/delete
  - Public verify:
    - `/api/v1/certificates/verify/{code}`
    - `/api/v1/certificates/verify/enrollment` (enrollment_no + dob)

### Gallery (Uploads)
- `routes/gallery.py`
  - `/api/v1/gallery/upload` -> file upload
  - File save location: `backend/uploads/`
  - DB stores `url` as `/uploads/<file>`

### Enquiries
- `routes/enquiries.py`
  - Public create enquiry
  - Admin list/delete

### Dashboard
- `routes/dashboard.py`
  - `/api/v1/dashboard/summary` -> stats for admin dashboard

### Exams (Online MCQ)
- `routes/exams.py`
  - Admin: create exam, add questions/options
  - Student:
    - `/api/v1/exams/student/available` -> available exams
    - `/api/v1/exams/{id}/start` -> start attempt
    - `/api/v1/exams/{id}/submit` -> submit answers

---
## 7) End-to-End Data Flow (Simple)

1) Admin Login -> token -> admin APIs
2) Admin creates Trade -> Course -> Student
3) Student photo upload saved in `/uploads/students/`
4) Fees/Expenses entered -> dashboard stats
5) Certificate create -> verify by code or enrollment + DOB
6) Gallery upload -> shows in admin + frontend
7) Exam create -> questions add -> student login -> exam start/submit

---
## 8) Where API Routes are Wired

- File: `backend/app/api/v1/api.py`
  - All route files included with prefixes:
    - `/auth`, `/student-auth`, `/courses`, `/trades`, `/students`, `/fees`, `/expenses`,
      `/certificates`, `/gallery`, `/exams`, `/enquiries`, `/dashboard`

---
## 9) Common Issues

- "no such column": DB old hai, `backend/app/db/migrate.py` run karo.
- 401 Unauthorized: token missing/expired, dobara login karke token lo.
- CORS error: `backend/.env` me `CORS_ORIGINS` me frontend/admin URLs add karo.

---
## 10) Quick File Index (Important)

- App entry: `backend/app/main.py`
- Config: `backend/app/core/config.py`
- Auth + JWT: `backend/app/core/security.py`
- DB engine: `backend/app/db/session.py`
- Migration: `backend/app/db/migrate.py`
- Routes: `backend/app/api/v1/routes/`
- Models: `backend/app/models/`
- Schemas: `backend/app/schemas/`
