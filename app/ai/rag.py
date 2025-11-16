import chromadb
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.tools import tool
from sqlalchemy.orm import Session
from app.crud import book as book_crud, member as member_crud, borrow as borrow_crud
from app.db.database import SessionLocal
import os
import json
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

class LibraryRAG:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your_openai_api_key_here":
            self.embeddings = OpenAIEmbeddings()
        else:
            self.embeddings = None
        self.chroma_client = chromadb.Client(Settings(
            anonymized_telemetry=False,
            is_persistent=False
        ))
        self.books_collection = "library_books"
        self.members_collection = "library_members"
        self.borrows_collection = "library_borrows"
        self.books_vectorstore = None
        self.members_vectorstore = None
        self.borrows_vectorstore = None

    def initialize_books_vectorstore(self):
        """Initialize or update the books vector store."""
        if not self.embeddings:
            return

        db = SessionLocal()
        try:
            books = book_crud.get_books(db)
            if not books:
                return

            documents = []
            metadatas = []
            ids = []

            for book in books:
                doc_text = f"Title: {book.title}\nAuthor: {book.author}\nISBN: {book.isbn}\nAvailability: {'Available' if book.available else 'Currently borrowed'}"
                documents.append(doc_text)
                metadatas.append({
                    "type": "book",
                    "book_id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "isbn": book.isbn,
                    "available": str(book.available)
                })
                ids.append(f"book_{book.id}")

            self.books_vectorstore = Chroma.from_texts(
                texts=documents,
                embedding=self.embeddings,
                metadatas=metadatas,
                ids=ids,
                collection_name=self.books_collection,
                client=self.chroma_client
            )
        finally:
            db.close()

    def initialize_members_vectorstore(self):
        """Initialize or update the members vector store."""
        if not self.embeddings:
            return

        db = SessionLocal()
        try:
            members = member_crud.get_members(db)
            if not members:
                return

            documents = []
            metadatas = []
            ids = []

            for member in members:
                # Get borrow history for context
                borrows = borrow_crud.get_member_borrows(db, member.id)
                active_borrows = [b for b in borrows if not b.is_returned]
                total_borrows = len(borrows)

                doc_text = f"Member Name: {member.name}\nEmail: {member.email}\nPhone: {member.phone or 'N/A'}\nTotal Borrows: {total_borrows}\nActive Borrows: {len(active_borrows)}"
                documents.append(doc_text)
                metadatas.append({
                    "type": "member",
                    "member_id": member.id,
                    "name": member.name,
                    "email": member.email,
                    "phone": member.phone or "",
                    "total_borrows": total_borrows,
                    "active_borrows": len(active_borrows)
                })
                ids.append(f"member_{member.id}")

            self.members_vectorstore = Chroma.from_texts(
                texts=documents,
                embedding=self.embeddings,
                metadatas=metadatas,
                ids=ids,
                collection_name=self.members_collection,
                client=self.chroma_client
            )
        finally:
            db.close()

    def initialize_borrows_vectorstore(self):
        """Initialize or update the borrows vector store."""
        if not self.embeddings:
            return

        db = SessionLocal()
        try:
            borrows = borrow_crud.get_borrows(db)
            if not borrows:
                return

            documents = []
            metadatas = []
            ids = []

            for borrow in borrows:
                book = book_crud.get_book(db, borrow.book_id)
                member = member_crud.get_member(db, borrow.member_id)

                if not book or not member:
                    continue

                status = "Returned" if borrow.is_returned else "Currently Borrowed"
                doc_text = f"Member: {member.name} borrowed '{book.title}' by {book.author}\nBorrowed: {borrow.borrowed_at.strftime('%Y-%m-%d')}\nStatus: {status}"
                if borrow.returned_at:
                    doc_text += f"\nReturned: {borrow.returned_at.strftime('%Y-%m-%d')}"

                documents.append(doc_text)
                metadatas.append({
                    "type": "borrow",
                    "borrow_id": borrow.id,
                    "book_id": borrow.book_id,
                    "member_id": borrow.member_id,
                    "book_title": book.title,
                    "book_author": book.author,
                    "member_name": member.name,
                    "is_returned": str(borrow.is_returned),
                    "borrowed_at": borrow.borrowed_at.isoformat()
                })
                ids.append(f"borrow_{borrow.id}")

            self.borrows_vectorstore = Chroma.from_texts(
                texts=documents,
                embedding=self.embeddings,
                metadatas=metadatas,
                ids=ids,
                collection_name=self.borrows_collection,
                client=self.chroma_client
            )
        finally:
            db.close()

    def initialize_vectorstore(self):
        """Initialize all vector stores."""
        self.initialize_books_vectorstore()
        self.initialize_members_vectorstore()
        self.initialize_borrows_vectorstore()

    def get_books_vectorstore(self):
        """Get or initialize the books vector store."""
        if self.books_vectorstore is None:
            self.initialize_books_vectorstore()
        return self.books_vectorstore

    def get_members_vectorstore(self):
        """Get or initialize the members vector store."""
        if self.members_vectorstore is None:
            self.initialize_members_vectorstore()
        return self.members_vectorstore

    def get_borrows_vectorstore(self):
        """Get or initialize the borrows vector store."""
        if self.borrows_vectorstore is None:
            self.initialize_borrows_vectorstore()
        return self.borrows_vectorstore

    def similarity_search_books(self, query: str, k: int = 5) -> List[Dict]:
        """Perform semantic similarity search on books."""
        vectorstore = self.get_books_vectorstore()
        if not vectorstore:
            return []

        results = vectorstore.similarity_search_with_score(query, k=k)

        search_results = []
        for doc, score in results:
            search_results.append({
                "type": "book",
                "book_id": doc.metadata.get("book_id"),
                "title": doc.metadata.get("title"),
                "author": doc.metadata.get("author"),
                "isbn": doc.metadata.get("isbn"),
                "available": doc.metadata.get("available") == "True",
                "relevance_score": float(score)
            })

        return search_results

    def similarity_search_members(self, query: str, k: int = 5) -> List[Dict]:
        """Perform semantic similarity search on members."""
        vectorstore = self.get_members_vectorstore()
        if not vectorstore:
            return []

        results = vectorstore.similarity_search_with_score(query, k=k)

        search_results = []
        for doc, score in results:
            search_results.append({
                "type": "member",
                "member_id": doc.metadata.get("member_id"),
                "name": doc.metadata.get("name"),
                "email": doc.metadata.get("email"),
                "phone": doc.metadata.get("phone"),
                "total_borrows": doc.metadata.get("total_borrows"),
                "active_borrows": doc.metadata.get("active_borrows"),
                "relevance_score": float(score)
            })

        return search_results

    def similarity_search_borrows(self, query: str, k: int = 5) -> List[Dict]:
        """Perform semantic similarity search on borrow records."""
        vectorstore = self.get_borrows_vectorstore()
        if not vectorstore:
            return []

        results = vectorstore.similarity_search_with_score(query, k=k)

        search_results = []
        for doc, score in results:
            search_results.append({
                "type": "borrow",
                "borrow_id": doc.metadata.get("borrow_id"),
                "book_id": doc.metadata.get("book_id"),
                "member_id": doc.metadata.get("member_id"),
                "book_title": doc.metadata.get("book_title"),
                "book_author": doc.metadata.get("book_author"),
                "member_name": doc.metadata.get("member_name"),
                "is_returned": doc.metadata.get("is_returned") == "True",
                "borrowed_at": doc.metadata.get("borrowed_at"),
                "relevance_score": float(score)
            })

        return search_results

    def similarity_search(self, query: str, k: int = 5) -> List[Dict]:
        """Perform semantic similarity search on books (backwards compatibility)."""
        return self.similarity_search_books(query, k)

    def refresh_vectorstore(self):
        """Refresh all vector stores with updated data."""
        self.books_vectorstore = None
        self.members_vectorstore = None
        self.borrows_vectorstore = None
        self.initialize_vectorstore()

library_rag = None

def get_library_rag():
    """Lazy initialize and return the LibraryRAG instance."""
    global library_rag
    if library_rag is None:
        library_rag = LibraryRAG()
    return library_rag

@tool
def recommend_books(query: str) -> str:
    """Get AI-powered book recommendations based on user interests or preferences using semantic search.
    Use this when users ask for recommendations, suggestions, or books similar to their interests.

    Args:
        query: The user's preferences, interests, or description of books they like
    """
    try:
        rag = get_library_rag()
        results = rag.similarity_search(query, k=5)

        if not results:
            rag.refresh_vectorstore()
            results = rag.similarity_search(query, k=5)

        if not results:
            return "No book recommendations available at this time."

        recommendations = []
        for result in results:
            recommendations.append({
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

def initialize_rag():
    """Initialize the RAG system at startup."""
    try:
        rag = get_library_rag()
        rag.initialize_vectorstore()
        return True
    except Exception as e:
        print(f"Error initializing RAG: {e}")
        return False
