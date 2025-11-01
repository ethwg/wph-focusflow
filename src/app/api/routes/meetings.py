from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from database.session import get_db
from database.models import MeetingSummary
from database.schema import MeetingSummarySchema

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("/", response_model=List[MeetingSummarySchema])
def get_meetings(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all meeting summaries with optional filtering by user_id"""
    query = db.query(MeetingSummary)
    if user_id:
        query = query.filter(MeetingSummary.user_id == user_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{meeting_id}", response_model=MeetingSummarySchema)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Get a specific meeting summary by ID"""
    meeting = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.post("/", response_model=MeetingSummarySchema)
def create_meeting(meeting_data: dict, db: Session = Depends(get_db)):
    """Create a new meeting summary"""
    new_meeting = MeetingSummary(**meeting_data)
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting


@router.put("/{meeting_id}", response_model=MeetingSummarySchema)
def update_meeting(meeting_id: int, meeting_data: dict, db: Session = Depends(get_db)):
    """Update an existing meeting summary"""
    meeting = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    for key, value in meeting_data.items():
        setattr(meeting, key, value)

    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Delete a meeting summary"""
    meeting = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}
