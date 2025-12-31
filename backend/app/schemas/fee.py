from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class FeeBase(BaseModel):
    student_id: int
    amount: float
    mode: Optional[str] = None
    paid_on: Optional[date] = None
    receipt_no: Optional[str] = None


class FeeCreate(FeeBase):
    pass


class FeeUpdate(BaseModel):
    amount: Optional[float] = None
    mode: Optional[str] = None
    paid_on: Optional[date] = None
    receipt_no: Optional[str] = None


class FeeOut(FeeBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
