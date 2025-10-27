from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas import member as schemas
from app.crud import member as crud

router = APIRouter(prefix="/members", tags=["members"])

@router.post("/", response_model=schemas.Member, status_code=status.HTTP_201_CREATED)
def create_member(member: schemas.MemberCreate, db: Session = Depends(get_db)):
    db_member = crud.get_member_by_email(db, email=member.email)
    if db_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return crud.create_member(db=db, member=member)

@router.get("/", response_model=List[schemas.Member])
def read_members(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_members(db, skip=skip, limit=limit)

@router.get("/{member_id}", response_model=schemas.Member)
def read_member(member_id: int, db: Session = Depends(get_db)):
    db_member = crud.get_member(db, member_id=member_id)
    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    return db_member

@router.put("/{member_id}", response_model=schemas.Member)
def update_member(member_id: int, member: schemas.MemberUpdate, db: Session = Depends(get_db)):
    db_member = crud.update_member(db, member_id=member_id, member=member)
    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    return db_member

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    success = crud.delete_member(db, member_id=member_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
