from langchain.tools import tool
from sqlalchemy.orm import Session
from app.crud import book as book_crud
from app.crud import borrow as borrow_crud
from app.crud import member as member_crud
from app.models.book import Book
from app.models.borrow import Borrow
from typing import List, Dict, Any
import json

def get_db_session():
    from app.db.database import SessionLocal
    db = SessionLocal()
    try:
        return db
    finally:
        pass

@tool
def search_books(query: str) -> str:
    """Search for books by title or author. Use this when users ask about specific books or authors.

    Args:
        query: The search term (book title or author name)
    """
    db = get_db_session()
    try:
        books = book_crud.get_books(db)
        query_lower = query.lower()

        matching_books = [
            book for book in books
            if query_lower in book.title.lower() or query_lower in book.author.lower()
        ]

        if not matching_books:
            return f"No books found matching '{query}'"

        results = []
        for book in matching_books[:10]:
            results.append({
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "isbn": book.isbn,
                "available": book.available
            })

        return json.dumps(results, indent=2)
    finally:
        db.close()

@tool
def check_book_availability(book_id: int) -> str:
    """Check if a specific book is available for borrowing.

    Args:
        book_id: The ID of the book to check
    """
    db = get_db_session()
    try:
        book = book_crud.get_book(db, book_id)
        if not book:
            return f"Book with ID {book_id} not found"

        result = {
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "available": book.available,
            "status": "Available for borrowing" if book.available else "Currently borrowed"
        }
        return json.dumps(result, indent=2)
    finally:
        db.close()

@tool
def get_member_borrow_history(member_id: int) -> str:
    """Get the borrowing history for a specific member.

    Args:
        member_id: The ID of the member
    """
    db = get_db_session()
    try:
        member = member_crud.get_member(db, member_id)
        if not member:
            return f"Member with ID {member_id} not found"

        borrows = borrow_crud.get_member_borrows(db, member_id)

        history = []
        for borrow in borrows:
            book = book_crud.get_book(db, borrow.book_id)
            history.append({
                "borrow_id": borrow.id,
                "book_title": book.title if book else "Unknown",
                "book_author": book.author if book else "Unknown",
                "borrowed_at": borrow.borrowed_at.isoformat(),
                "returned_at": borrow.returned_at.isoformat() if borrow.returned_at else None,
                "is_returned": borrow.is_returned
            })

        result = {
            "member_name": member.name,
            "member_email": member.email,
            "total_borrows": len(history),
            "active_borrows": len([b for b in history if not b["is_returned"]]),
            "history": history
        }

        return json.dumps(result, indent=2)
    finally:
        db.close()

@tool
def get_library_statistics() -> str:
    """Get overall library statistics including total books, members, and borrowing activity."""
    db = get_db_session()
    try:
        total_books = len(book_crud.get_books(db))
        available_books = len(book_crud.get_available_books(db))
        total_members = len(member_crud.get_members(db))
        active_borrows = len(borrow_crud.get_active_borrows(db))
        all_borrows = len(borrow_crud.get_borrows(db))

        stats = {
            "total_books": total_books,
            "available_books": available_books,
            "borrowed_books": total_books - available_books,
            "total_members": total_members,
            "active_borrows": active_borrows,
            "total_borrows_all_time": all_borrows,
            "return_rate": f"{(all_borrows - active_borrows) / max(all_borrows, 1) * 100:.1f}%"
        }

        return json.dumps(stats, indent=2)
    finally:
        db.close()

@tool
def get_all_available_books() -> str:
    """Get a list of all currently available books in the library."""
    db = get_db_session()
    try:
        books = book_crud.get_available_books(db)

        if not books:
            return "No books are currently available"

        results = []
        for book in books:
            results.append({
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "isbn": book.isbn
            })

        return json.dumps(results, indent=2)
    finally:
        db.close()

def get_all_tools():
    """Return all available tools for the agent."""
    return [
        search_books,
        check_book_availability,
        get_member_borrow_history,
        get_library_statistics,
        get_all_available_books
    ]
