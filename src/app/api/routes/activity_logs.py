from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database.session import get_db
from database.models import ActivityLog
from database.schema import ActivityLogSchema

router = APIRouter(prefix="/activity-logs", tags=["activity_logs"])


@router.get("/", response_model=List[ActivityLogSchema])
def get_activity_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all activity logs with optional filtering by user_id"""
    query = db.query(ActivityLog)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{log_id}", response_model=ActivityLogSchema)
def get_activity_log(log_id: int, db: Session = Depends(get_db)):
    """Get a specific activity log by ID"""
    log = db.query(ActivityLog).filter(ActivityLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Activity log not found")
    return log


@router.post("/", response_model=ActivityLogSchema)
def create_activity_log(log_data: dict, db: Session = Depends(get_db)):
    """Create a new activity log"""
    new_log = ActivityLog(**log_data)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@router.put("/{log_id}", response_model=ActivityLogSchema)
def update_activity_log(log_id: int, log_data: dict, db: Session = Depends(get_db)):
    """Update an existing activity log"""
    log = db.query(ActivityLog).filter(ActivityLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Activity log not found")

    for key, value in log_data.items():
        setattr(log, key, value)

    db.commit()
    db.refresh(log)
    return log


@router.delete("/{log_id}")
def delete_activity_log(log_id: int, db: Session = Depends(get_db)):
    """Delete an activity log"""
    log = db.query(ActivityLog).filter(ActivityLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Activity log not found")

    db.delete(log)
    db.commit()
    return {"message": "Activity log deleted successfully"}
