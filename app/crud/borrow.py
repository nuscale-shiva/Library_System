from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.borrow import Borrow
from app.models.book import Book
from app.models.member import Member
from app.schemas import borrow as schemas
from typing import List, Optional, Tuple
from datetime import datetime

def get_borrow(db: Session, borrow_id: int) -> Optional[Borrow]:
    return db.query(Borrow).filter(Borrow.id == borrow_id).first()

def get_borrows(db: Session, skip: int = 0, limit: int = 100) -> List[Borrow]:
    return db.query(Borrow).offset(skip).limit(limit).all()

def get_active_borrows(db: Session, skip: int = 0, limit: int = 100) -> List[Borrow]:
    return db.query(Borrow).filter(Borrow.is_returned == False).offset(skip).limit(limit).all()

def get_member_borrows(db: Session, member_id: int) -> List[Borrow]:
    return db.query(Borrow).filter(Borrow.member_id == member_id).all()

def create_borrow(db: Session, borrow: schemas.BorrowCreate) -> Tuple[Optional[Borrow], Optional[str]]:
    """
    Create a borrow record. Returns (borrow, error_message).
    """
    # Check if member exists
    db_member = db.query(Member).filter(Member.id == borrow.member_id).first()
    if not db_member:
        return None, "Member not found"

    # Check if book exists
    db_book = db.query(Book).filter(Book.id == borrow.book_id).first()
    if not db_book:
        return None, "Book not found"

    if not db_book.available:
        return None, "Book is currently not available"

    try:
        db_borrow = Borrow(**borrow.model_dump())
        db_book.available = False

        db.add(db_borrow)
        db.commit()
        db.refresh(db_borrow)
        return db_borrow, None
    except IntegrityError as e:
        db.rollback()
        return None, "Database constraint violation"

def return_borrow(db: Session, borrow_id: int) -> Optional[Borrow]:
    db_borrow = get_borrow(db, borrow_id)

    if not db_borrow or db_borrow.is_returned:
        return None

    try:
        db_borrow.is_returned = True
        db_borrow.returned_at = datetime.utcnow()

        db_book = db.query(Book).filter(Book.id == db_borrow.book_id).first()
        if db_book:
            db_book.available = True

        db.commit()
        db.refresh(db_borrow)
        return db_borrow
    except IntegrityError as e:
        db.rollback()
        return None
