from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from database.models import ActionTemplate
from database.schema import ActionTemplateCreate, ActionTemplateRead

router = APIRouter(prefix="/action-templates", tags=["action_templates"])


@router.get("/", response_model=List[ActionTemplateRead])
def get_action_templates(
    skip: int = 0,
    limit: int = 100,
    role_id: int = None,
    tool_id: int = None,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all action templates with optional filtering"""
    query = db.query(ActionTemplate)
    if role_id:
        query = query.filter(ActionTemplate.role_id == role_id)
    if tool_id:
        query = query.filter(ActionTemplate.tool_id == tool_id)
    if active_only:
        query = query.filter(ActionTemplate.active == True)
    return query.offset(skip).limit(limit).all()


@router.get("/{template_id}", response_model=ActionTemplateRead)
def get_action_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific action template by ID"""
    template = db.query(ActionTemplate).filter(ActionTemplate.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Action template not found")
    return template


@router.get("/action-type/{action_type}", response_model=ActionTemplateRead)
def get_action_template_by_type(action_type: str, db: Session = Depends(get_db)):
    """Get an action template by action type"""
    template = db.query(ActionTemplate).filter(ActionTemplate.action_type == action_type).first()
    if not template:
        raise HTTPException(status_code=404, detail="Action template not found")
    return template


@router.post("/", response_model=ActionTemplateRead)
def create_action_template(template_data: ActionTemplateCreate, db: Session = Depends(get_db)):
    """Create a new action template"""
    # Check if action_type already exists
    existing_template = db.query(ActionTemplate).filter(
        ActionTemplate.action_type == template_data.action_type
    ).first()
    if existing_template:
        raise HTTPException(status_code=400, detail="Action type already exists")

    new_template = ActionTemplate(**template_data.dict())
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template


@router.put("/{template_id}", response_model=ActionTemplateRead)
def update_action_template(template_id: int, template_data: ActionTemplateCreate, db: Session = Depends(get_db)):
    """Update an existing action template"""
    template = db.query(ActionTemplate).filter(ActionTemplate.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Action template not found")

    for key, value in template_data.dict().items():
        setattr(template, key, value)

    db.commit()
    db.refresh(template)
    return template


@router.patch("/{template_id}/toggle-active", response_model=ActionTemplateRead)
def toggle_action_template_active(template_id: int, db: Session = Depends(get_db)):
    """Toggle the active status of an action template"""
    template = db.query(ActionTemplate).filter(ActionTemplate.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Action template not found")

    template.active = not template.active
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}")
def delete_action_template(template_id: int, db: Session = Depends(get_db)):
    """Delete an action template"""
    template = db.query(ActionTemplate).filter(ActionTemplate.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Action template not found")

    db.delete(template)
    db.commit()
    return {"message": "Action template deleted successfully"}
