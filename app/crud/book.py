from sqlalchemy.orm import Session
from app.models.book import Book
from app.schemas import book as schemas
from typing import List, Optional

def get_book(db: Session, book_id: int) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()

def get_book_by_isbn(db: Session, isbn: str) -> Optional[Book]:
    return db.query(Book).filter(Book.isbn == isbn).first()

def get_books(db: Session, skip: int = 0, limit: int = 100) -> List[Book]:
    return db.query(Book).offset(skip).limit(limit).all()

def get_available_books(db: Session, skip: int = 0, limit: int = 100) -> List[Book]:
    return db.query(Book).filter(Book.available == True).offset(skip).limit(limit).all()

def create_book(db: Session, book: schemas.BookCreate) -> Book:
    db_book = Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def update_book(db: Session, book_id: int, book: schemas.BookUpdate) -> Optional[Book]:
    db_book = get_book(db, book_id)
    if not db_book:
        return None

    update_data = book.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_book, field, value)

    db.commit()
    db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_id: int) -> bool:
    db_book = get_book(db, book_id)
    if not db_book:
        return False

    db.delete(db_book)
    db.commit()
    return True
