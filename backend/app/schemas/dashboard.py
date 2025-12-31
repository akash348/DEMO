from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_students: int
    total_courses: int
    total_enquiries: int
    total_fees: float
    total_expenses: float
    total_certificates: int
    total_gallery_items: int
