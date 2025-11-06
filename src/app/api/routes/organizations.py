from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from database.models import Organization
from database.schema import OrganizationCreate, OrganizationRead

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/", response_model=List[OrganizationRead])
def get_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all organizations"""
    return db.query(Organization).offset(skip).limit(limit).all()


@router.get("/{org_id}", response_model=OrganizationRead)
def get_organization(org_id: int, db: Session = Depends(get_db)):
    """Get a specific organization by ID"""
    org = db.query(Organization).filter(Organization.org_id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/subdomain/{subdomain}", response_model=OrganizationRead)
def get_organization_by_subdomain(subdomain: str, db: Session = Depends(get_db)):
    """Get an organization by subdomain"""
    org = db.query(Organization).filter(Organization.subdomain == subdomain).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.post("/", response_model=OrganizationRead)
def create_organization(org_data: OrganizationCreate, db: Session = Depends(get_db)):
    """Create a new organization"""
    # Check if subdomain already exists
    existing_org = db.query(Organization).filter(Organization.subdomain == org_data.subdomain).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Subdomain already exists")

    new_org = Organization(**org_data.dict())
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org


@router.put("/{org_id}", response_model=OrganizationRead)
def update_organization(org_id: int, org_data: OrganizationCreate, db: Session = Depends(get_db)):
    """Update an existing organization"""
    org = db.query(Organization).filter(Organization.org_id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    for key, value in org_data.dict().items():
        setattr(org, key, value)

    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}")
def delete_organization(org_id: int, db: Session = Depends(get_db)):
    """Delete an organization"""
    org = db.query(Organization).filter(Organization.org_id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    db.delete(org)
    db.commit()
    return {"message": "Organization deleted successfully"}
