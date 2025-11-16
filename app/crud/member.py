from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.member import Member
from app.models.borrow import Borrow
from app.schemas import member as schemas
from typing import List, Optional, Tuple

def get_member(db: Session, member_id: int) -> Optional[Member]:
    return db.query(Member).filter(Member.id == member_id).first()

def get_member_by_email(db: Session, email: str) -> Optional[Member]:
    return db.query(Member).filter(Member.email == email).first()

def get_members(db: Session, skip: int = 0, limit: int = 100) -> List[Member]:
    return db.query(Member).offset(skip).limit(limit).all()

def create_member(db: Session, member: schemas.MemberCreate) -> Member:
    try:
        db_member = Member(**member.model_dump())
        db.add(db_member)
        db.commit()
        db.refresh(db_member)
        return db_member
    except IntegrityError as e:
        db.rollback()
        raise

def update_member(db: Session, member_id: int, member: schemas.MemberUpdate) -> Optional[Member]:
    db_member = get_member(db, member_id)
    if not db_member:
        return None

    try:
        update_data = member.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_member, field, value)

        db.commit()
        db.refresh(db_member)
        return db_member
    except IntegrityError as e:
        db.rollback()
        raise

def delete_member(db: Session, member_id: int) -> Tuple[bool, Optional[str]]:
    """
    Delete a member. Returns (success, error_message).

    A member can only be deleted if they have no borrow history.
    This preserves data integrity and historical records.
    """
    db_member = get_member(db, member_id)
    if not db_member:
        return False, None

    # Check for any borrow history
    total_borrows = db.query(Borrow).filter(Borrow.member_id == member_id).count()

    if total_borrows > 0:
        active_borrows = db.query(Borrow).filter(
            Borrow.member_id == member_id,
            Borrow.is_returned == False
        ).count()

        if active_borrows > 0:
            return False, f"Cannot delete member with {active_borrows} active borrow(s). Please return all books first."
        else:
            return False, f"Cannot delete member with borrow history ({total_borrows} past borrow(s)). Historical records must be preserved."

    try:
        db.delete(db_member)
        db.commit()
        return True, None
    except IntegrityError as e:
        db.rollback()
        return False, "Cannot delete member due to database constraint violation"
