from sqlalchemy.orm import Session
from app.models.member import Member
from app.schemas import member as schemas
from typing import List, Optional

def get_member(db: Session, member_id: int) -> Optional[Member]:
    return db.query(Member).filter(Member.id == member_id).first()

def get_member_by_email(db: Session, email: str) -> Optional[Member]:
    return db.query(Member).filter(Member.email == email).first()

def get_members(db: Session, skip: int = 0, limit: int = 100) -> List[Member]:
    return db.query(Member).offset(skip).limit(limit).all()

def create_member(db: Session, member: schemas.MemberCreate) -> Member:
    db_member = Member(**member.model_dump())
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def update_member(db: Session, member_id: int, member: schemas.MemberUpdate) -> Optional[Member]:
    db_member = get_member(db, member_id)
    if not db_member:
        return None

    update_data = member.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_member, field, value)

    db.commit()
    db.refresh(db_member)
    return db_member

def delete_member(db: Session, member_id: int) -> bool:
    db_member = get_member(db, member_id)
    if not db_member:
        return False

    db.delete(db_member)
    db.commit()
    return True
