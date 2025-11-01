from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import date, datetime, timedelta
from pydantic import BaseModel

from database.session import get_db
from database.models import ActivityLog, UserAccount, Tool, ActionTemplate, WeeklyReport

router = APIRouter(prefix="/calendar", tags=["calendar"])


# Pydantic models for request/response
class CalendarEntryUpdate(BaseModel):
    minutes: Optional[int] = None
    title: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[Dict] = None


class CalendarEntry(BaseModel):
    log_id: int
    user_id: int
    tool_id: Optional[int]
    template_id: Optional[int]
    event_time: datetime
    minutes: Optional[int]
    title: Optional[str]
    status: Optional[str]
    metadata: Optional[Dict]
    tool_name: Optional[str]
    template_name: Optional[str]

    class Config:
        orm_mode = True


@router.get("/user/{user_id}/week/{week_start}")
def get_user_calendar_week(
    user_id: int,
    week_start: date,
    db: Session = Depends(get_db)
):
    """Fetch weekly calendar entries (activity logs) for a user"""
    # Verify user exists
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate week end (7 days from start)
    week_end = week_start + timedelta(days=7)

    # Get all activity logs for the week
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.event_time >= week_start,
        ActivityLog.event_time < week_end
    ).order_by(ActivityLog.event_time).all()

    # Format response with additional data
    calendar_entries = []
    for activity in activities:
        # Get tool name if applicable
        tool_name = None
        if activity.tool_id:
            tool = db.query(Tool).filter(Tool.tool_id == activity.tool_id).first()
            tool_name = tool.name if tool else None

        # Get template name if applicable
        template_name = None
        if activity.template_id:
            template = db.query(ActionTemplate).filter(ActionTemplate.template_id == activity.template_id).first()
            template_name = template.display_name if template else None

        entry = {
            "log_id": activity.log_id,
            "user_id": activity.user_id,
            "tool_id": activity.tool_id,
            "template_id": activity.template_id,
            "event_time": activity.event_time,
            "minutes": activity.minutes,
            "title": activity.title,
            "status": activity.status,
            "metadata": activity.metadata_json,
            "tool_name": tool_name,
            "template_name": template_name
        }
        calendar_entries.append(entry)

    # Get weekly report if it exists
    weekly_report = db.query(WeeklyReport).filter(
        WeeklyReport.user_id == user_id,
        WeeklyReport.week_start == week_start
    ).first()

    # Calculate summary stats
    total_minutes = sum(e["minutes"] for e in calendar_entries if e["minutes"])
    total_activities = len(calendar_entries)

    return {
        "user_id": user_id,
        "week_start": week_start,
        "week_end": week_end,
        "total_minutes": total_minutes,
        "total_activities": total_activities,
        "published": weekly_report.published if weekly_report else False,
        "entries": calendar_entries
    }


@router.get("/user/{user_id}/date/{activity_date}")
def get_user_calendar_date(
    user_id: int,
    activity_date: date,
    db: Session = Depends(get_db)
):
    """Fetch calendar entries (activity logs) for a specific date"""
    # Verify user exists
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get start and end of the day
    day_start = datetime.combine(activity_date, datetime.min.time())
    day_end = day_start + timedelta(days=1)

    # Get all activity logs for the date
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.event_time >= day_start,
        ActivityLog.event_time < day_end
    ).order_by(ActivityLog.event_time).all()

    # Format response
    calendar_entries = []
    for activity in activities:
        tool_name = None
        if activity.tool_id:
            tool = db.query(Tool).filter(Tool.tool_id == activity.tool_id).first()
            tool_name = tool.name if tool else None

        template_name = None
        if activity.template_id:
            template = db.query(ActionTemplate).filter(ActionTemplate.template_id == activity.template_id).first()
            template_name = template.display_name if template else None

        entry = {
            "log_id": activity.log_id,
            "user_id": activity.user_id,
            "tool_id": activity.tool_id,
            "template_id": activity.template_id,
            "event_time": activity.event_time,
            "minutes": activity.minutes,
            "title": activity.title,
            "status": activity.status,
            "metadata": activity.metadata_json,
            "tool_name": tool_name,
            "template_name": template_name
        }
        calendar_entries.append(entry)

    total_minutes = sum(e["minutes"] for e in calendar_entries if e["minutes"])

    return {
        "user_id": user_id,
        "date": activity_date,
        "total_minutes": total_minutes,
        "total_activities": len(calendar_entries),
        "entries": calendar_entries
    }


@router.put("/{entry_id}")
def update_calendar_entry(
    entry_id: int,
    update_data: CalendarEntryUpdate,
    db: Session = Depends(get_db)
):
    """Update hours/task details for a calendar entry (activity log)"""
    # Get the activity log
    activity = db.query(ActivityLog).filter(ActivityLog.log_id == entry_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Calendar entry not found")

    # Update only provided fields
    if update_data.minutes is not None:
        activity.minutes = update_data.minutes

    if update_data.title is not None:
        activity.title = update_data.title

    if update_data.status is not None:
        activity.status = update_data.status

    if update_data.metadata is not None:
        # Merge with existing metadata
        existing_metadata = activity.metadata_json or {}
        existing_metadata.update(update_data.metadata)
        activity.metadata_json = existing_metadata

    db.commit()
    db.refresh(activity)

    return {
        "message": "Calendar entry updated successfully",
        "log_id": activity.log_id,
        "minutes": activity.minutes,
        "title": activity.title,
        "status": activity.status
    }


@router.delete("/{entry_id}")
def delete_calendar_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a calendar entry (activity log)"""
    activity = db.query(ActivityLog).filter(ActivityLog.log_id == entry_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Calendar entry not found")

    db.delete(activity)
    db.commit()

    return {"message": "Calendar entry deleted successfully"}


@router.post("/{entry_id}/publish")
def publish_calendar_entry(entry_id: int, db: Session = Depends(get_db)):
    """Mark a calendar entry as published (updates status to 'published')"""
    activity = db.query(ActivityLog).filter(ActivityLog.log_id == entry_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Calendar entry not found")

    # Update status to published
    activity.status = "published"
    db.commit()
    db.refresh(activity)

    return {
        "message": "Calendar entry published successfully",
        "log_id": activity.log_id,
        "status": activity.status
    }


@router.post("/user/{user_id}/week/{week_start}/publish")
def publish_week(user_id: int, week_start: date, db: Session = Depends(get_db)):
    """Mark an entire week as published (updates weekly report and all entries)"""
    # Verify user exists
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get or create weekly report
    weekly_report = db.query(WeeklyReport).filter(
        WeeklyReport.user_id == user_id,
        WeeklyReport.week_start == week_start
    ).first()

    if not weekly_report:
        raise HTTPException(status_code=404, detail="Weekly report not found. Generate report first.")

    # Mark weekly report as published
    weekly_report.published = True

    # Get all activities for the week and mark them as published
    week_end = week_start + timedelta(days=7)
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.event_time >= week_start,
        ActivityLog.event_time < week_end
    ).all()

    for activity in activities:
        activity.status = "published"

    db.commit()

    return {
        "message": "Week published successfully",
        "user_id": user_id,
        "week_start": week_start,
        "published": True,
        "activities_published": len(activities)
    }
