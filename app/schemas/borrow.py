from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BorrowBase(BaseModel):
    book_id: int
    member_id: int

class BorrowCreate(BorrowBase):
    pass

class BorrowReturn(BaseModel):
    pass

class Borrow(BorrowBase):
    id: int
    borrowed_at: datetime
    returned_at: Optional[datetime] = None
    is_returned: bool

    class Config:
        from_attributes = True
