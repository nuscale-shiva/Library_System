from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import book, member, borrow
from app.ai.router import router as ai_router
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

@app.get("/")
def root():
    return {"message": "Library Borrowing System API with AI Assistant", "docs": "/docs"}
