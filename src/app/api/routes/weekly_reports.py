from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from database.session import get_db
from database.models import WeeklyReport
from database.schema import WeeklyReportSchema

router = APIRouter(prefix="/weekly-reports", tags=["weekly_reports"])


@router.get("/", response_model=List[WeeklyReportSchema])
def get_weekly_reports(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all weekly reports with optional filtering by user_id"""
    query = db.query(WeeklyReport)
    if user_id:
        query = query.filter(WeeklyReport.user_id == user_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{report_id}", response_model=WeeklyReportSchema)
def get_weekly_report(report_id: int, db: Session = Depends(get_db)):
    """Get a specific weekly report by ID"""
    report = db.query(WeeklyReport).filter(WeeklyReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Weekly report not found")
    return report


@router.get("/user/{user_id}/week/{week_start}", response_model=WeeklyReportSchema)
def get_weekly_report_by_user_and_week(
    user_id: int,
    week_start: date,
    db: Session = Depends(get_db)
):
    """Get a weekly report for a specific user and week"""
    report = db.query(WeeklyReport).filter(
        WeeklyReport.user_id == user_id,
        WeeklyReport.week_start == week_start
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Weekly report not found")
    return report


@router.post("/", response_model=WeeklyReportSchema)
def create_weekly_report(report_data: dict, db: Session = Depends(get_db)):
    """Create a new weekly report"""
    new_report = WeeklyReport(**report_data)
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report


@router.put("/{report_id}", response_model=WeeklyReportSchema)
def update_weekly_report(report_id: int, report_data: dict, db: Session = Depends(get_db)):
    """Update an existing weekly report"""
    report = db.query(WeeklyReport).filter(WeeklyReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Weekly report not found")

    for key, value in report_data.items():
        setattr(report, key, value)

    db.commit()
    db.refresh(report)
    return report


@router.delete("/{report_id}")
def delete_weekly_report(report_id: int, db: Session = Depends(get_db)):
    """Delete a weekly report"""
    report = db.query(WeeklyReport).filter(WeeklyReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Weekly report not found")

    db.delete(report)
    db.commit()
    return {"message": "Weekly report deleted successfully"}
