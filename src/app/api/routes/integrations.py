from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from pydantic import BaseModel

from database.session import get_db
from database.models import UserAccount, Tool

router = APIRouter(prefix="/integrations", tags=["integrations"])


# Pydantic models for request/response
class IntegrationConnect(BaseModel):
    user_id: int
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    oauth_data: Optional[Dict] = {}
    config: Optional[Dict] = {}


class IntegrationResponse(BaseModel):
    tool_id: int
    tool_name: str
    connected: bool
    connection_data: Optional[Dict] = {}


@router.get("/user/{user_id}", response_model=List[IntegrationResponse])
def get_user_integrations(user_id: int, db: Session = Depends(get_db)):
    """Get all available integrations and their connection status for a user"""
    # Get user
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all available tools
    tools = db.query(Tool).filter(Tool.active == True).all()

    # Get user's tool connections
    tool_connections = user.tool_connections or {}

    # Build response
    integrations = []
    for tool in tools:
        integration = IntegrationResponse(
            tool_id=tool.tool_id,
            tool_name=tool.name,
            connected=str(tool.tool_id) in tool_connections,
            connection_data=tool_connections.get(str(tool.tool_id), {})
        )
        integrations.append(integration)

    return integrations


@router.get("/{tool_id}/user/{user_id}")
def get_integration_status(tool_id: int, user_id: int, db: Session = Depends(get_db)):
    """Get connection status for a specific integration"""
    # Get user
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get tool
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Get tool connections
    tool_connections = user.tool_connections or {}
    is_connected = str(tool_id) in tool_connections

    return {
        "tool_id": tool_id,
        "tool_name": tool.name,
        "connected": is_connected,
        "connection_data": tool_connections.get(str(tool_id), {}) if is_connected else None
    }


@router.post("/{tool_id}/connect")
def connect_integration(tool_id: int, connection_data: IntegrationConnect, db: Session = Depends(get_db)):
    """Connect an integration (OAuth / token connect)"""
    # Get user
    user = db.query(UserAccount).filter(UserAccount.user_id == connection_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get tool
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    if not tool.active:
        raise HTTPException(status_code=400, detail="Tool is not active")

    # Get existing tool connections or initialize
    tool_connections = user.tool_connections or {}

    # Check if already connected
    if str(tool_id) in tool_connections:
        raise HTTPException(status_code=400, detail="Integration already connected")

    # Store connection data
    from datetime import datetime
    connection_info = {
        "connected_at": datetime.now().isoformat(),
        "access_token": connection_data.access_token,
        "refresh_token": connection_data.refresh_token,
        "oauth_data": connection_data.oauth_data,
        "config": connection_data.config
    }

    # Add connection
    tool_connections[str(tool_id)] = connection_info
    user.tool_connections = tool_connections

    db.commit()
    db.refresh(user)

    return {
        "message": "Integration connected successfully",
        "tool_id": tool_id,
        "tool_name": tool.name,
        "user_id": user.user_id
    }


@router.put("/{tool_id}/update")
def update_integration(tool_id: int, connection_data: IntegrationConnect, db: Session = Depends(get_db)):
    """Update an existing integration connection (e.g., refresh tokens)"""
    # Get user
    user = db.query(UserAccount).filter(UserAccount.user_id == connection_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get tool
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Get existing tool connections
    tool_connections = user.tool_connections or {}

    # Check if connected
    if str(tool_id) not in tool_connections:
        raise HTTPException(status_code=400, detail="Integration not connected")

    # Update connection data
    from datetime import datetime
    existing_connection = tool_connections[str(tool_id)]
    existing_connection.update({
        "updated_at": datetime.now().isoformat(),
        "access_token": connection_data.access_token or existing_connection.get("access_token"),
        "refresh_token": connection_data.refresh_token or existing_connection.get("refresh_token"),
        "oauth_data": connection_data.oauth_data or existing_connection.get("oauth_data"),
        "config": connection_data.config or existing_connection.get("config")
    })

    tool_connections[str(tool_id)] = existing_connection
    user.tool_connections = tool_connections

    db.commit()
    db.refresh(user)

    return {
        "message": "Integration updated successfully",
        "tool_id": tool_id,
        "tool_name": tool.name,
        "user_id": user.user_id
    }


@router.delete("/{tool_id}/disconnect")
def disconnect_integration(tool_id: int, user_id: int, db: Session = Depends(get_db)):
    """Disconnect an integration (revoke integration)"""
    # Get user
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get tool
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Get existing tool connections
    tool_connections = user.tool_connections or {}

    # Check if connected
    if str(tool_id) not in tool_connections:
        raise HTTPException(status_code=400, detail="Integration not connected")

    # Remove connection
    del tool_connections[str(tool_id)]
    user.tool_connections = tool_connections

    db.commit()

    return {
        "message": "Integration disconnected successfully",
        "tool_id": tool_id,
        "tool_name": tool.name,
        "user_id": user_id
    }
