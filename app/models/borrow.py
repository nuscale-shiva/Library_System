from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean
from datetime import datetime
from app.db.database import Base

class Borrow(Base):
    __tablename__ = "borrows"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    borrowed_at = Column(DateTime, default=datetime.utcnow)
    returned_at = Column(DateTime, nullable=True)
    is_returned = Column(Boolean, default=False)
