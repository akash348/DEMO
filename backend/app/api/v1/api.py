from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    certificates,
    courses,
    dashboard,
    enquiries,
    exams,
    expenses,
    fees,
    gallery,
    student_auth,
    students,
    trades,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(student_auth.router, prefix="/student-auth", tags=["student-auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(trades.router, prefix="/trades", tags=["trades"])
api_router.include_router(enquiries.router, prefix="/enquiries", tags=["enquiries"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(fees.router, prefix="/fees", tags=["fees"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
api_router.include_router(gallery.router, prefix="/gallery", tags=["gallery"])
api_router.include_router(exams.router, prefix="/exams", tags=["exams"])
