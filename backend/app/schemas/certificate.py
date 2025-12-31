from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class CertificateBase(BaseModel):
    student_id: int
    course_id: int
    issued_on: Optional[date] = None
    certificate_code: str
    qr_url: Optional[str] = None
    grade: Optional[str] = None
    percentage: Optional[float] = None
    status: str = "valid"


class CertificateCreate(CertificateBase):
    pass


class CertificateUpdate(BaseModel):
    issued_on: Optional[date] = None
    qr_url: Optional[str] = None
    grade: Optional[str] = None
    percentage: Optional[float] = None
    status: Optional[str] = None


class CertificateOut(CertificateBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
