from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from database.models import Role
from database.schema import RoleCreate, RoleRead

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("/", response_model=List[RoleRead])
def get_roles(
    skip: int = 0,
    limit: int = 100,
    department: str = None,
    db: Session = Depends(get_db)
):
    """Get all roles with optional filtering by department"""
    query = db.query(Role)
    if department:
        query = query.filter(Role.department == department)
    return query.offset(skip).limit(limit).all()


@router.get("/{role_id}", response_model=RoleRead)
def get_role(role_id: int, db: Session = Depends(get_db)):
    """Get a specific role by ID"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.get("/name/{name}", response_model=RoleRead)
def get_role_by_name(name: str, db: Session = Depends(get_db)):
    """Get a role by name"""
    role = db.query(Role).filter(Role.name == name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.post("/", response_model=RoleRead)
def create_role(role_data: RoleCreate, db: Session = Depends(get_db)):
    """Create a new role"""
    # Check if role name already exists
    existing_role = db.query(Role).filter(Role.name == role_data.name).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="Role name already exists")

    new_role = Role(**role_data.dict())
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role


@router.put("/{role_id}", response_model=RoleRead)
def update_role(role_id: int, role_data: RoleCreate, db: Session = Depends(get_db)):
    """Update an existing role"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    for key, value in role_data.dict().items():
        setattr(role, key, value)

    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """Delete a role"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    db.delete(role)
    db.commit()
    return {"message": "Role deleted successfully"}
