from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from database.models import Notification
from database.schema import NotificationSchema

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationSchema])
def get_notifications(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    unread_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all notifications with optional filtering"""
    query = db.query(Notification)
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.read == False)
    return query.offset(skip).limit(limit).all()


@router.get("/{notification_id}", response_model=NotificationSchema)
def get_notification(notification_id: int, db: Session = Depends(get_db)):
    """Get a specific notification by ID"""
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.post("/", response_model=NotificationSchema)
def create_notification(notification_data: dict, db: Session = Depends(get_db)):
    """Create a new notification"""
    new_notification = Notification(**notification_data)
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    return new_notification


@router.put("/{notification_id}", response_model=NotificationSchema)
def update_notification(notification_id: int, notification_data: dict, db: Session = Depends(get_db)):
    """Update an existing notification"""
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    for key, value in notification_data.items():
        setattr(notification, key, value)

    db.commit()
    db.refresh(notification)
    return notification


@router.patch("/{notification_id}/mark-read", response_model=NotificationSchema)
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    """Delete a notification"""
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}
