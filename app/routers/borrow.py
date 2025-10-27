from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas import borrow as schemas
from app.crud import borrow as crud

router = APIRouter(prefix="/borrow", tags=["borrow"])

@router.post("/", response_model=schemas.Borrow, status_code=status.HTTP_201_CREATED)
def create_borrow(borrow: schemas.BorrowCreate, db: Session = Depends(get_db)):
    db_borrow = crud.create_borrow(db=db, borrow=borrow)
    if not db_borrow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book not available or not found"
        )
    return db_borrow

@router.get("/", response_model=List[schemas.Borrow])
def read_borrows(skip: int = 0, limit: int = 100, active_only: bool = False, db: Session = Depends(get_db)):
    if active_only:
        return crud.get_active_borrows(db, skip=skip, limit=limit)
    return crud.get_borrows(db, skip=skip, limit=limit)

@router.get("/{borrow_id}", response_model=schemas.Borrow)
def read_borrow(borrow_id: int, db: Session = Depends(get_db)):
    db_borrow = crud.get_borrow(db, borrow_id=borrow_id)
    if not db_borrow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow record not found"
        )
    return db_borrow

@router.get("/member/{member_id}", response_model=List[schemas.Borrow])
def read_member_borrows(member_id: int, db: Session = Depends(get_db)):
    return crud.get_member_borrows(db, member_id=member_id)

@router.post("/{borrow_id}/return", response_model=schemas.Borrow)
def return_book(borrow_id: int, db: Session = Depends(get_db)):
    db_borrow = crud.return_borrow(db, borrow_id=borrow_id)
    if not db_borrow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Borrow record not found or already returned"
        )
    return db_borrow
