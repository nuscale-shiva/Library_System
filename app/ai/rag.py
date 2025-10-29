import chromadb
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.tools import tool
from sqlalchemy.orm import Session
from app.crud import book as book_crud
from app.db.database import SessionLocal
import os
import json
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

class LibraryRAG:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.chroma_client = chromadb.Client(Settings(
            anonymized_telemetry=False,
            is_persistent=False
        ))
        self.collection_name = "library_books"
        self.vectorstore = None

    def initialize_vectorstore(self):
        """Initialize or update the vector store with current book data."""
        db = SessionLocal()
        try:
            books = book_crud.get_books(db)

            if not books:
                return

            documents = []
            metadatas = []
            ids = []

            for book in books:
                doc_text = f"Title: {book.title}\nAuthor: {book.author}\nISBN: {book.isbn}\nAvailable: {book.available}"
                documents.append(doc_text)
                metadatas.append({
                    "book_id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "isbn": book.isbn,
                    "available": str(book.available)
                })
                ids.append(f"book_{book.id}")

            self.vectorstore = Chroma.from_texts(
                texts=documents,
                embedding=self.embeddings,
                metadatas=metadatas,
                ids=ids,
                collection_name=self.collection_name,
                client=self.chroma_client
            )

        finally:
            db.close()

    def get_vectorstore(self):
        """Get or initialize the vector store."""
        if self.vectorstore is None:
            self.initialize_vectorstore()
        return self.vectorstore

    def similarity_search(self, query: str, k: int = 5) -> List[Dict]:
        """Perform semantic similarity search on books."""
        vectorstore = self.get_vectorstore()
        if not vectorstore:
            return []

        results = vectorstore.similarity_search_with_score(query, k=k)

        search_results = []
        for doc, score in results:
            search_results.append({
                "book_id": doc.metadata.get("book_id"),
                "title": doc.metadata.get("title"),
                "author": doc.metadata.get("author"),
                "isbn": doc.metadata.get("isbn"),
                "available": doc.metadata.get("available") == "True",
                "relevance_score": float(score)
            })

        return search_results

    def refresh_vectorstore(self):
        """Refresh the vector store with updated book data."""
        self.vectorstore = None
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
