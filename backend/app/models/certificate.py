from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.sql import func

from app.db.base import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    issued_on = Column(Date, nullable=True)
    certificate_code = Column(String(100), unique=True, index=True, nullable=False)
    qr_url = Column(String(255), nullable=True)
    grade = Column(String(20), nullable=True)
    percentage = Column(Numeric(5, 2), nullable=True)
    status = Column(String(50), default="valid")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
