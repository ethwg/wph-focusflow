from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from database.session import get_db
from database.models import DailySummary
from database.schema import DailySummarySchema

router = APIRouter(prefix="/daily-summaries", tags=["daily_summaries"])


@router.get("/", response_model=List[DailySummarySchema])
def get_daily_summaries(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all daily summaries with optional filtering by user_id"""
    query = db.query(DailySummary)
    if user_id:
        query = query.filter(DailySummary.user_id == user_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{summary_id}", response_model=DailySummarySchema)
def get_daily_summary(summary_id: int, db: Session = Depends(get_db)):
    """Get a specific daily summary by ID"""
    summary = db.query(DailySummary).filter(DailySummary.summary_id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Daily summary not found")
    return summary


@router.get("/user/{user_id}/date/{summary_date}", response_model=DailySummarySchema)
def get_daily_summary_by_user_and_date(
    user_id: int,
    summary_date: date,
    db: Session = Depends(get_db)
):
    """Get a daily summary for a specific user and date"""
    summary = db.query(DailySummary).filter(
        DailySummary.user_id == user_id,
        DailySummary.summary_date == summary_date
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Daily summary not found")
    return summary


@router.post("/", response_model=DailySummarySchema)
def create_daily_summary(summary_data: dict, db: Session = Depends(get_db)):
    """Create a new daily summary"""
    new_summary = DailySummary(**summary_data)
    db.add(new_summary)
    db.commit()
    db.refresh(new_summary)
    return new_summary


@router.put("/{summary_id}", response_model=DailySummarySchema)
def update_daily_summary(summary_id: int, summary_data: dict, db: Session = Depends(get_db)):
    """Update an existing daily summary"""
    summary = db.query(DailySummary).filter(DailySummary.summary_id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Daily summary not found")

    for key, value in summary_data.items():
        setattr(summary, key, value)

    db.commit()
    db.refresh(summary)
    return summary


@router.delete("/{summary_id}")
def delete_daily_summary(summary_id: int, db: Session = Depends(get_db)):
    """Delete a daily summary"""
    summary = db.query(DailySummary).filter(DailySummary.summary_id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Daily summary not found")

    db.delete(summary)
    db.commit()
    return {"message": "Daily summary deleted successfully"}
