from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.book import Book
from app.models.borrow import Borrow
from app.schemas import book as schemas
from typing import List, Optional, Tuple

def get_book(db: Session, book_id: int) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()

def get_book_by_isbn(db: Session, isbn: str) -> Optional[Book]:
    return db.query(Book).filter(Book.isbn == isbn).first()

def get_books(db: Session, skip: int = 0, limit: int = 100) -> List[Book]:
    return db.query(Book).offset(skip).limit(limit).all()

def get_available_books(db: Session, skip: int = 0, limit: int = 100) -> List[Book]:
    return db.query(Book).filter(Book.available == True).offset(skip).limit(limit).all()

def create_book(db: Session, book: schemas.BookCreate) -> Book:
    try:
        db_book = Book(**book.model_dump())
        db.add(db_book)
        db.commit()
        db.refresh(db_book)
        return db_book
    except IntegrityError as e:
        db.rollback()
        raise

def update_book(db: Session, book_id: int, book: schemas.BookUpdate) -> Optional[Book]:
    db_book = get_book(db, book_id)
    if not db_book:
        return None

    try:
        update_data = book.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_book, field, value)

        db.commit()
        db.refresh(db_book)
        return db_book
    except IntegrityError as e:
        db.rollback()
        raise

def delete_book(db: Session, book_id: int) -> Tuple[bool, Optional[str]]:
    """
    Delete a book. Returns (success, error_message).

    A book can only be deleted if it has no borrow history.
    This preserves data integrity and historical records.
    """
    db_book = get_book(db, book_id)
    if not db_book:
        return False, None

    # Check for any borrow history
    total_borrows = db.query(Borrow).filter(Borrow.book_id == book_id).count()

    if total_borrows > 0:
        active_borrows = db.query(Borrow).filter(
            Borrow.book_id == book_id,
            Borrow.is_returned == False
        ).count()

        if active_borrows > 0:
            return False, f"Cannot delete book with {active_borrows} active borrow(s). Please return the book first."
        else:
            return False, f"Cannot delete book with borrow history ({total_borrows} past borrow(s)). Historical records must be preserved."

    try:
        db.delete(db_book)
        db.commit()
        return True, None
    except IntegrityError as e:
        db.rollback()
        return False, "Cannot delete book due to database constraint violation"
