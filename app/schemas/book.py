from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BookBase(BaseModel):
    title: str
    author: str
    isbn: str

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    available: Optional[bool] = None

class Book(BookBase):
    id: int
    available: bool
    created_at: datetime

    class Config:
        from_attributes = True
