from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class StudentBase(BaseModel):
    enrollment_no: Optional[str] = None
    name: str
    father_name: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    course_id: Optional[int] = None
    dob: Optional[date] = None
    photo_url: Optional[str] = None
    join_date: Optional[date] = None
    status: str = "active"
    login_enabled: bool = False


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    enrollment_no: Optional[str] = None
    name: Optional[str] = None
    father_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    course_id: Optional[int] = None
    dob: Optional[date] = None
    photo_url: Optional[str] = None
    join_date: Optional[date] = None
    status: Optional[str] = None
    login_enabled: Optional[bool] = None


class StudentOut(StudentBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
