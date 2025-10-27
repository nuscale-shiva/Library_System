from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.db.database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    author = Column(String, nullable=False)
    isbn = Column(String, unique=True, nullable=False, index=True)
    available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
