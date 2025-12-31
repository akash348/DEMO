from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.sql import func

from app.db.base import Base


class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    mode = Column(String(30), nullable=True)
    paid_on = Column(Date, nullable=True)
    receipt_no = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
