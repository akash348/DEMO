from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class ExpenseBase(BaseModel):
    title: str
    amount: float
    category: Optional[str] = None
    paid_on: Optional[date] = None
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    paid_on: Optional[date] = None
    notes: Optional[str] = None


class ExpenseOut(ExpenseBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
