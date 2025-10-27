from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class MemberBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

class MemberCreate(MemberBase):
    pass

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class Member(MemberBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
