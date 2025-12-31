from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.enquiry import Enquiry
from app.models.expense import Expense
from app.models.fee import Fee
from app.models.gallery import Gallery
from app.models.student import Student
from app.schemas.dashboard import DashboardSummary

router = APIRouter(dependencies=[Depends(get_current_user)])


def _to_float(value) -> float:
    if value is None:
        return 0.0
    return float(value)


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)):
    total_students = db.query(func.count(Student.id)).scalar() or 0
    total_courses = db.query(func.count(Course.id)).scalar() or 0
    total_enquiries = db.query(func.count(Enquiry.id)).scalar() or 0
    total_fees = db.query(func.coalesce(func.sum(Fee.amount), 0)).scalar()
    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar()
    total_certificates = db.query(func.count(Certificate.id)).scalar() or 0
    total_gallery_items = db.query(func.count(Gallery.id)).scalar() or 0

    return DashboardSummary(
        total_students=total_students,
        total_courses=total_courses,
        total_enquiries=total_enquiries,
        total_fees=_to_float(total_fees),
        total_expenses=_to_float(total_expenses),
        total_certificates=total_certificates,
        total_gallery_items=total_gallery_items,
    )
