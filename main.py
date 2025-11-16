from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import book, member, borrow
from app.ai.router import router as ai_router
from app.ai.voice_router import router as voice_router
from app.ai.rag import initialize_rag
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_rag()
    yield

app = FastAPI(
    title="Library Borrowing System",
    description="Production-grade backend for managing library books, members, and borrowing activities with AI assistant",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(book.router)
app.include_router(member.router)
app.include_router(borrow.router)
app.include_router(ai_router)
app.include_router(voice_router)

@app.get("/")
def root():
    return {"message": "Library Borrowing System API with AI Assistant", "docs": "/docs"}

@app.get("/health")
def health_check():
    """
    Health check endpoint for system status monitoring.
    Returns database and AI service status.
    """
    from app.db.database import SessionLocal
    from datetime import datetime
    import os

    status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "online",
            "database": "unknown",
            "ai": "unknown"
        }
    }

    # Check database
    try:
        db = SessionLocal()
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()
        status["services"]["database"] = "online"
    except Exception as e:
        status["services"]["database"] = "offline"
        status["status"] = "degraded"

    # Check AI service
    if os.getenv("OPENAI_API_KEY"):
        status["services"]["ai"] = "online"
    else:
        status["services"]["ai"] = "offline"
        status["status"] = "degraded"

    return status
