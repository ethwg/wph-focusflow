from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from database.models import UserAccount
from database.schema import UserAccountRead, UserAccountUpdate, UserAccountCreate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserAccountRead])
def get_users(
    skip: int = 0,
    limit: int = 100,
    org_id: int = None,
    team_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all users with optional filtering by org_id or team_id"""
    query = db.query(UserAccount)
    if org_id:
        query = query.filter(UserAccount.org_id == org_id)
    if team_id:
        query = query.filter(UserAccount.team_id == team_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserAccountRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserAccountRead)
def create_user(user_data: UserAccountCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    # Check if email already exists
    existing_user = db.query(UserAccount).filter(UserAccount.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = UserAccount(**user_data.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserAccountRead)
def update_user(user_id: int, user_data: UserAccountUpdate, db: Session = Depends(get_db)):
    """Update user account information (personal info, timezone, team, role, etc.)"""
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only fields that are provided (not None)
    update_data = user_data.dict(exclude_unset=True)

    # If email is being updated, check it's not already taken
    if "email" in update_data and update_data["email"] != user.email:
        existing_user = db.query(UserAccount).filter(UserAccount.email == update_data["email"]).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Soft delete a user (set deleted_at timestamp)"""
    from datetime import datetime

    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Soft delete by setting deleted_at timestamp
    user.deleted_at = datetime.now()
    db.commit()
    return {"message": "User deleted successfully"}
