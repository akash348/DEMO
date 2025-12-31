from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TradeBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True


class TradeCreate(TradeBase):
    pass


class TradeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TradeOut(TradeBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
