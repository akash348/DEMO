# Pragati Institute – Institute Management System
Complete Frontend + Admin Panel + Backend Flow Document  
Institute Name: Pragati Institute – Skill Based Technical Training  
Address: 22 A, Station Road, Hussainganj, Lucknow

---
## 1) Project Overview
This document defines a complete Institute Management System including:
- Public Website (Frontend)
- Admin Panel (Private)
- Backend APIs (Python)
- Database
- Fees, certificate verification, gallery management

End-to-end flow:  
Visitor → Website → Enquiry → Admin Panel → Student Creation → Fees → Training → Certificate → Verification

---
## 2) Recommended Tech Stack
### Frontend (Public + Admin)
- React JS (Vite)
- React Router
- Axios for API
- UI: Tailwind CSS or MUI (any one)

### Backend
- Python + FastAPI
- Auth: JWT
- Database: MySQL or PostgreSQL

---
## 3) System Modules
1. Frontend Website (Public)
2. Admin Panel (Private)
3. Backend APIs
4. Database

---
## 4) Frontend (Public Website) Features
- Home Page with courses and enquiry button
- About Us page
- Courses list + Course Details
- Gallery (Photos & Videos)
- Certificate Verification
- Contact & Enquiry Form

---
## 5) Admin Panel Features
- Secure Admin Login
- Dashboard with key stats
- Student Management (CRUD)
- Fees Management
- Income & Expense Tracking
- Certificate Generation & Verification
- Gallery Management
- Enquiry Management

---
## 6) Suggested Repository Structure
```
pragati-institute/
  frontend/                 # Public website (React)
    src/
      api/
      assets/
      components/
      layouts/
      pages/
      routes/
      utils/
  admin/                     # Admin panel (React)
    src/
      api/
      components/
      layouts/
      pages/
      routes/
      utils/
  backend/                   # Python (FastAPI)
    app/
      api/
        v1/
          routes/
      core/
      db/
      models/
      schemas/
      services/
      main.py
    tests/
  docs/
```

---
## 7) Frontend Routes (Public)
```
/                   Home
/about              About Us
/courses            Courses
/courses/:id        Course Details
/gallery            Photos & Videos
/verify             Certificate Verification
/contact            Contact / Enquiry
```

### Admin Routes (Private)
```
/admin/login
/admin/dashboard
/admin/students
/admin/courses
/admin/fees
/admin/expenses
/admin/certificates
/admin/gallery
/admin/enquiries
```

---
## 8) Backend (FastAPI) Structure
```
backend/app/
  main.py                 # FastAPI app
  core/
    config.py             # env settings
    security.py           # JWT logic
  db/
    session.py            # DB connection
    base.py               # SQLAlchemy base
  models/
    user.py
    student.py
    course.py
    enquiry.py
    fee.py
    expense.py
    certificate.py
    gallery.py
  schemas/
    user.py
    student.py
    course.py
    enquiry.py
    fee.py
    expense.py
    certificate.py
    gallery.py
  services/
    student_service.py
    fee_service.py
    certificate_service.py
  api/
    v1/
      routes/
        auth.py
        students.py
        courses.py
        enquiries.py
        fees.py
        expenses.py
        certificates.py
        gallery.py
```

---
## 9) Core API Endpoints (Sample)
```
POST   /api/v1/auth/login
POST   /api/v1/enquiries
GET    /api/v1/courses
GET    /api/v1/courses/{id}

GET    /api/v1/students
POST   /api/v1/students
PUT    /api/v1/students/{id}
DELETE /api/v1/students/{id}

GET    /api/v1/fees
POST   /api/v1/fees

GET    /api/v1/expenses
POST   /api/v1/expenses

POST   /api/v1/certificates
GET    /api/v1/certificates/verify/{code}

GET    /api/v1/gallery
POST   /api/v1/gallery
DELETE /api/v1/gallery/{id}
```

---
## 10) Database Tables (Suggested Fields)
### users
- id, name, email, password_hash, role, is_active, created_at

### students
- id, name, phone, email, address, course_id, join_date, status

### courses
- id, title, description, duration, fee, is_active

### enquiries
- id, name, phone, email, message, source, created_at

### fees
- id, student_id, amount, mode, paid_on, receipt_no

### expenses
- id, title, amount, category, paid_on, notes

### certificates
- id, student_id, course_id, issued_on, certificate_code, qr_url, status

### gallery
- id, type (photo/video), title, url, created_at, is_active

---
## 11) Certificate Verification Flow
1. Admin generates certificate and unique `certificate_code`
2. Code + QR saved in database
3. Public verification page calls `/certificates/verify/{code}`
4. API returns student + course + issued date

---
## 12) Enquiry Flow
1. Visitor submits enquiry form
2. Backend saves into `enquiries` table
3. Admin views and converts enquiry to student

---
## 13) Future Enhancements
- Online Admission
- Student Login
- Online Payments
- Attendance System

