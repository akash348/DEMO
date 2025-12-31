from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CourseBase(BaseModel):
    trade_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    duration: Optional[str] = None
    fee: Optional[float] = None
    is_active: bool = True


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    trade_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    fee: Optional[float] = None
    is_active: Optional[bool] = None


class CourseOut(CourseBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
