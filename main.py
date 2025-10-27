from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.routers import book, member, borrow

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Library Borrowing System",
    description="Production-grade backend for managing library books, members, and borrowing activities",
    version="1.0.0"
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

@app.get("/")
def root():
    return {"message": "Library Borrowing System API", "docs": "/docs"}
