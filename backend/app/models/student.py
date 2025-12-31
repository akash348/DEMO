from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.db.base import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_no = Column(String(50), unique=True, index=True, nullable=True)
    name = Column(String(120), nullable=False)
    father_name = Column(String(120), nullable=True)
    phone = Column(String(30), nullable=False)
    email = Column(String(120), nullable=True)
    address = Column(String(255), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    dob = Column(Date, nullable=True)
    photo_url = Column(String(255), nullable=True)
    login_password_hash = Column(String(255), nullable=True)
    login_enabled = Column(Boolean, default=False)
    join_date = Column(Date, nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
