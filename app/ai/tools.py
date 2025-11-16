from langchain.tools import tool
from sqlalchemy.orm import Session
from app.crud import book as book_crud
from app.crud import borrow as borrow_crud
from app.crud import member as member_crud
from app.models.book import Book
from app.models.borrow import Borrow
from app.schemas import book as book_schema
from app.schemas import member as member_schema
from app.schemas import borrow as borrow_schema
from typing import List, Dict, Any, Optional
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

@tool
def get_all_books() -> str:
    """Get a list of all books in the library (both available and borrowed)."""
    db = get_db_session()
    try:
        books = book_crud.get_books(db)

        if not books:
            return "No books in the library"

        results = []
        for book in books:
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
def get_all_members() -> str:
    """Get a list of all library members."""
    db = get_db_session()
    try:
        members = member_crud.get_members(db)

        if not members:
            return "No members registered in the library"

        results = []
        for member in members:
            results.append({
                "id": member.id,
                "name": member.name,
                "email": member.email,
                "phone": member.phone
            })

        return json.dumps(results, indent=2)
    finally:
        db.close()

@tool
def add_book(title: str, author: str, isbn: str) -> str:
    """Add a new book to the library.

    Args:
        title: The title of the book
        author: The author of the book
        isbn: The ISBN number of the book
    """
    db = get_db_session()
    try:
        book_data = book_schema.BookCreate(
            title=title,
            author=author,
            isbn=isbn
        )

        new_book = book_crud.create_book(db, book_data)

        result = {
            "success": True,
            "message": f"Book '{title}' by {author} has been successfully added to the library",
            "book": {
                "id": new_book.id,
                "title": new_book.title,
                "author": new_book.author,
                "isbn": new_book.isbn,
                "available": new_book.available
            }
        }

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Failed to add book: {str(e)}"
        }, indent=2)
    finally:
        db.close()

@tool
def update_book(book_id: int, title: Optional[str] = None, author: Optional[str] = None,
                isbn: Optional[str] = None, available: Optional[bool] = None) -> str:
    """Update an existing book's information.

    Args:
        book_id: The ID of the book to update
        title: New title (optional)
        author: New author (optional)
        isbn: New ISBN (optional)
        available: New availability status (optional)
    """
    db = get_db_session()
    try:
        book = book_crud.get_book(db, book_id)
        if not book:
            return json.dumps({
                "success": False,
                "message": f"Book with ID {book_id} not found"
            }, indent=2)

        update_data = book_schema.BookUpdate(
            title=title,
            author=author,
            isbn=isbn,
            available=available
        )

        updated_book = book_crud.update_book(db, book_id, update_data)

        result = {
            "success": True,
            "message": f"Book '{updated_book.title}' has been successfully updated",
            "book": {
                "id": updated_book.id,
                "title": updated_book.title,
                "author": updated_book.author,
                "isbn": updated_book.isbn,
                "available": updated_book.available
            }
        }

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Failed to update book: {str(e)}"
        }, indent=2)
    finally:
        db.close()

@tool
def delete_book(book_id: int) -> str:
    """Delete a book from the library.

    Args:
        book_id: The ID of the book to delete
    """
    db = get_db_session()
    try:
        book = book_crud.get_book(db, book_id)
        if not book:
            return json.dumps({
                "success": False,
                "message": f"Book with ID {book_id} not found"
            }, indent=2)

        book_title = book.title
        success, error_message = book_crud.delete_book(db, book_id)

        if success:
            return json.dumps({
                "success": True,
                "message": f"Book '{book_title}' has been successfully deleted from the library"
            }, indent=2)
        else:
            return json.dumps({
                "success": False,
                "message": error_message or "Failed to delete book"
            }, indent=2)
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Failed to delete book: {str(e)}"
        }, indent=2)
    finally:
        db.close()

@tool
def add_member(name: str, email: str, phone: Optional[str] = None) -> str:
    """Register a new member in the library.

    Args:
        name: The name of the member
        email: The email address of the member
        phone: The phone number of the member (optional)
    """
    db = get_db_session()
    try:
        member_data = member_schema.MemberCreate(
            name=name,
            email=email,
            phone=phone
        )

        new_member = member_crud.create_member(db, member_data)

        result = {
            "success": True,
            "message": f"Member '{name}' has been successfully registered",
            "member": {
                "id": new_member.id,
                "name": new_member.name,
                "email": new_member.email,
                "phone": new_member.phone
            }
        }

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Failed to register member: {str(e)}"
        }, indent=2)
    finally:
        db.close()

@tool
def update_member(member_id: int, name: Optional[str] = None,
                  email: Optional[str] = None, phone: Optional[str] = None) -> str:
    """Update an existing member's information.

    Args:
        member_id: The ID of the member to update
        name: New name (optional)
        email: New email (optional)
        phone: New phone number (optional)
    """
    db = get_db_session()
    try:
        member = member_crud.get_member(db, member_id)
        if not member:
            return json.dumps({
                "success": False,
                "message": f"Member with ID {member_id} not found"
            }, indent=2)

        update_data = member_schema.MemberUpdate(
            name=name,
            email=email,
            phone=phone
        )

        updated_member = member_crud.update_member(db, member_id, update_data)

        result = {
            "success": True,
            "message": f"Member '{updated_member.name}' has been successfully updated",
            "member": {
                "id": updated_member.id,
                "name": updated_member.name,
                "email": updated_member.email,
                "phone": updated_member.phone
            }
        }

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Failed to update member: {str(e)}"
        }, indent=2)
    finally:
        db.close()

@tool
def delete_member(member_id: int) -> str:
    """Delete a member from the library.

    Args:
        member_id: The ID of the member to delete
    """
    db = get_db_session()
    try:
        member = member_crud.get_member(db, member_id)
        if not member:
            return json.dumps({
                "success": False,
                "message": f"Member with ID {member_id} not found"
            }, indent=2)

        member_name = member.name
        success, error_message = member_crud.delete_member(db, member_id)

        if success:
            return json.dumps({
                "success": True,
                "message": f"Member '{member_name}' has been successfully deleted from the library"
            }, indent=2)
        else:
            return json.dumps({
                "success": False,
                "message": error_message or "Failed to delete member"
            }, indent=2)
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Failed to delete member: {str(e)}"
        }, indent=2)
    finally:
        db.close()

@tool
def create_borrow(book_id: int, member_id: int) -> str:
    """Let a member borrow a book from the library.

    Args:
        book_id: The ID of the book to borrow
        member_id: The ID of the member borrowing the book
    """
    db = get_db_session()
    try:
        # Check if book exists and is available
        book = book_crud.get_book(db, book_id)
        if not book:
            return json.dumps({
                "success": False,
                "message": f"Book with ID {book_id} not found"
            }, indent=2)

        if not book.available:
            return json.dumps({
                "success": False,
                "message": f"Book '{book.title}' is currently borrowed and not available"
            }, indent=2)

        # Check if member exists
        member = member_crud.get_member(db, member_id)
        if not member:
            return json.dumps({
                "success": False,
                "message": f"Member with ID {member_id} not found"
            }, indent=2)

        borrow_data = borrow_schema.BorrowCreate(
            book_id=book_id,
            member_id=member_id
        )

        new_borrow, error_message = borrow_crud.create_borrow(db, borrow_data)

        if not new_borrow:
            return json.dumps({
                "success": False,
                "message": error_message or "Failed to create borrow"
            }, indent=2)

        result = {
            "success": True,
            "message": f"Member '{member.name}' has successfully borrowed '{book.title}' by {book.author}",
            "borrow": {
                "id": new_borrow.id,
                "book_id": new_borrow.book_id,
                "member_id": new_borrow.member_id,
                "borrowed_at": new_borrow.borrowed_at.isoformat(),
                "is_returned": new_borrow.is_returned
            }
        }

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Failed to create borrow: {str(e)}"
        }, indent=2)
    finally:
        db.close()

@tool
def return_book(borrow_id: int) -> str:
    """Mark a borrowed book as returned.

    Args:
        borrow_id: The ID of the borrow record to mark as returned
    """
    db = get_db_session()
    try:
        borrow = borrow_crud.get_borrow(db, borrow_id)
        if not borrow:
            return json.dumps({
                "success": False,
                "message": f"Borrow record with ID {borrow_id} not found"
            }, indent=2)

        if borrow.is_returned:
            book = book_crud.get_book(db, borrow.book_id)
            return json.dumps({
                "success": False,
                "message": f"This book has already been returned on {borrow.returned_at.isoformat()}"
            }, indent=2)

        book = book_crud.get_book(db, borrow.book_id)
        member = member_crud.get_member(db, borrow.member_id)

        returned_borrow = borrow_crud.return_borrow(db, borrow_id)

        if not returned_borrow:
            return json.dumps({
                "success": False,
                "message": "Failed to return book"
            }, indent=2)

        result = {
            "success": True,
            "message": f"Member '{member.name}' has successfully returned '{book.title}'",
            "borrow": {
                "id": returned_borrow.id,
                "book_id": returned_borrow.book_id,
                "member_id": returned_borrow.member_id,
                "borrowed_at": returned_borrow.borrowed_at.isoformat(),
                "returned_at": returned_borrow.returned_at.isoformat(),
                "is_returned": returned_borrow.is_returned
            }
        }

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({
            "success": False,
            "message": f"Failed to return book: {str(e)}"
        }, indent=2)
    finally:
        db.close()

@tool
def recommend_books(query: str) -> str:
    """Get intelligent AI-powered book recommendations based on user preferences using semantic search.
    Use this when users ask for book recommendations, suggestions, or books similar to their interests.

    Args:
        query: The user's preferences, interests, or description of books they like
    """
    try:
        from app.ai.rag import get_library_rag
        rag = get_library_rag()
        results = rag.similarity_search_books(query, k=5)

        if not results:
            rag.refresh_vectorstore()
            results = rag.similarity_search_books(query, k=5)

        if not results:
            return "No book recommendations available at this time."

        recommendations = []
        for result in results:
            recommendations.append({
                "id": result["book_id"],
                "title": result["title"],
                "author": result["author"],
                "available": result["available"],
                "relevance": f"{(1 - result['relevance_score']) * 100:.1f}%"
            })

        return json.dumps({
            "query": query,
            "recommendations": recommendations
        }, indent=2)

    except Exception as e:
        return f"Error generating recommendations: {str(e)}"

@tool
def semantic_search_library(query: str) -> str:
    """Perform comprehensive semantic search across books, members, and borrow history.
    Use this for complex queries about library patterns, trends, or cross-entity searches.

    Args:
        query: Natural language search query
    """
    try:
        from app.ai.rag import get_library_rag
        rag = get_library_rag()

        # Search across all collections
        books = rag.similarity_search_books(query, k=3)
        members = rag.similarity_search_members(query, k=3)
        borrows = rag.similarity_search_borrows(query, k=3)

        result = {
            "query": query,
            "books": books if books else [],
            "members": members if members else [],
            "borrows": borrows if borrows else []
        }

        return json.dumps(result, indent=2)

    except Exception as e:
        return f"Error performing semantic search: {str(e)}"

@tool
def find_member_by_description(query: str) -> str:
    """Find members using natural language description or characteristics.
    Use this when searching for members based on activity, behavior, or fuzzy criteria.

    Args:
        query: Natural language description of the member to find
    """
    try:
        from app.ai.rag import get_library_rag
        rag = get_library_rag()
        results = rag.similarity_search_members(query, k=5)

        if not results:
            rag.refresh_vectorstore()
            results = rag.similarity_search_members(query, k=5)

        if not results:
            return "No members found matching the description."

        members = []
        for result in results:
            members.append({
                "id": result["member_id"],
                "name": result["name"],
                "email": result["email"],
                "phone": result["phone"],
                "total_borrows": result["total_borrows"],
                "active_borrows": result["active_borrows"],
                "relevance": f"{(1 - result['relevance_score']) * 100:.1f}%"
            })

        return json.dumps({
            "query": query,
            "members": members
        }, indent=2)

    except Exception as e:
        return f"Error finding members: {str(e)}"

def get_all_tools():
    """Return all available tools for the agent."""
    return [
        # Query/Search tools
        search_books,
        check_book_availability,
        get_member_borrow_history,
        get_library_statistics,
        get_all_available_books,
        get_all_books,
        get_all_members,
        # RAG-powered semantic search tools
        recommend_books,
        semantic_search_library,
        find_member_by_description,
        # Book CRUD tools
        add_book,
        update_book,
        delete_book,
        # Member CRUD tools
        add_member,
        update_member,
        delete_member,
        # Borrow/Return tools
        create_borrow,
        return_book
    ]
