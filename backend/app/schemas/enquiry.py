from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class EnquiryBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    message: Optional[str] = None
    source: str = "website"


class EnquiryCreate(EnquiryBase):
    pass


class EnquiryOut(EnquiryBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
