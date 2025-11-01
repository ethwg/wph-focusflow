from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from database.models import Tool
from database.schema import ToolCreate, ToolRead

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("/", response_model=List[ToolRead])
def get_tools(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all tools with optional filtering"""
    query = db.query(Tool)
    if category:
        query = query.filter(Tool.category == category)
    if active_only:
        query = query.filter(Tool.active == True)
    return query.offset(skip).limit(limit).all()


@router.get("/{tool_id}", response_model=ToolRead)
def get_tool(tool_id: int, db: Session = Depends(get_db)):
    """Get a specific tool by ID"""
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.get("/name/{name}", response_model=ToolRead)
def get_tool_by_name(name: str, db: Session = Depends(get_db)):
    """Get a tool by name"""
    tool = db.query(Tool).filter(Tool.name == name).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.post("/", response_model=ToolRead)
def create_tool(tool_data: ToolCreate, db: Session = Depends(get_db)):
    """Create a new tool"""
    # Check if tool name already exists
    existing_tool = db.query(Tool).filter(Tool.name == tool_data.name).first()
    if existing_tool:
        raise HTTPException(status_code=400, detail="Tool name already exists")

    new_tool = Tool(**tool_data.dict())
    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)
    return new_tool


@router.put("/{tool_id}", response_model=ToolRead)
def update_tool(tool_id: int, tool_data: ToolCreate, db: Session = Depends(get_db)):
    """Update an existing tool"""
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    for key, value in tool_data.dict().items():
        setattr(tool, key, value)

    db.commit()
    db.refresh(tool)
    return tool


@router.patch("/{tool_id}/toggle-active", response_model=ToolRead)
def toggle_tool_active(tool_id: int, db: Session = Depends(get_db)):
    """Toggle the active status of a tool"""
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    tool.active = not tool.active
    db.commit()
    db.refresh(tool)
    return tool


@router.delete("/{tool_id}")
def delete_tool(tool_id: int, db: Session = Depends(get_db)):
    """Delete a tool"""
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    db.delete(tool)
    db.commit()
    return {"message": "Tool deleted successfully"}
