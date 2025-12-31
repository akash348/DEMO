from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.base import Base


class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=False)
    email = Column(String(120), nullable=True)
    message = Column(Text, nullable=True)
    source = Column(String(50), default="website")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
