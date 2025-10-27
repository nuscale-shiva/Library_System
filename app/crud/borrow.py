from sqlalchemy.orm import Session
from app.models.borrow import Borrow
from app.models.book import Book
from app.schemas import borrow as schemas
from typing import List, Optional
from datetime import datetime

def get_borrow(db: Session, borrow_id: int) -> Optional[Borrow]:
    return db.query(Borrow).filter(Borrow.id == borrow_id).first()

def get_borrows(db: Session, skip: int = 0, limit: int = 100) -> List[Borrow]:
    return db.query(Borrow).offset(skip).limit(limit).all()

def get_active_borrows(db: Session, skip: int = 0, limit: int = 100) -> List[Borrow]:
    return db.query(Borrow).filter(Borrow.is_returned == False).offset(skip).limit(limit).all()

def get_member_borrows(db: Session, member_id: int) -> List[Borrow]:
    return db.query(Borrow).filter(Borrow.member_id == member_id).all()

def create_borrow(db: Session, borrow: schemas.BorrowCreate) -> Optional[Borrow]:
    db_book = db.query(Book).filter(Book.id == borrow.book_id).first()

    if not db_book or not db_book.available:
        return None

    db_borrow = Borrow(**borrow.model_dump())
    db_book.available = False

    db.add(db_borrow)
    db.commit()
    db.refresh(db_borrow)
    return db_borrow

def return_borrow(db: Session, borrow_id: int) -> Optional[Borrow]:
    db_borrow = get_borrow(db, borrow_id)

    if not db_borrow or db_borrow.is_returned:
        return None

    db_borrow.is_returned = True
    db_borrow.returned_at = datetime.utcnow()

    db_book = db.query(Book).filter(Book.id == db_borrow.book_id).first()
    if db_book:
        db_book.available = True

    db.commit()
    db.refresh(db_borrow)
    return db_borrow
