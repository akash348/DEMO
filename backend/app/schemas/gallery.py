from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class GalleryBase(BaseModel):
    media_type: str
    title: Optional[str] = None
    url: str
    is_active: bool = True


class GalleryCreate(GalleryBase):
    pass


class GalleryUpdate(BaseModel):
    media_type: Optional[str] = None
    title: Optional[str] = None
    url: Optional[str] = None
    is_active: Optional[bool] = None


class GalleryOut(GalleryBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
