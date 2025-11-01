from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from database.session import get_db
from database.models import TeamReport, UserAccount, WeeklyReport, ActivityLog
from database.schema import TeamReportSchema

router = APIRouter(prefix="/team-reports", tags=["team_reports"])


@router.get("/", response_model=List[TeamReportSchema])
def get_team_reports(
    skip: int = 0,
    limit: int = 100,
    team_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all team reports with optional filtering by team_id"""
    query = db.query(TeamReport)
    if team_id:
        query = query.filter(TeamReport.team_id == team_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{team_report_id}", response_model=TeamReportSchema)
def get_team_report(team_report_id: int, db: Session = Depends(get_db)):
    """Get a specific team report by ID"""
    report = db.query(TeamReport).filter(TeamReport.team_report_id == team_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Team report not found")
    return report


@router.get("/team/{team_id}/week/{week_start}", response_model=TeamReportSchema)
def get_team_report_by_team_and_week(
    team_id: int,
    week_start: date,
    db: Session = Depends(get_db)
):
    """Get a team report for a specific team and week"""
    report = db.query(TeamReport).filter(
        TeamReport.team_id == team_id,
        TeamReport.week_start == week_start
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Team report not found")
    return report


@router.post("/", response_model=TeamReportSchema)
def create_team_report(report_data: dict, db: Session = Depends(get_db)):
    """Create a new team report"""
    new_report = TeamReport(**report_data)
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report


@router.put("/{team_report_id}", response_model=TeamReportSchema)
def update_team_report(team_report_id: int, report_data: dict, db: Session = Depends(get_db)):
    """Update an existing team report"""
    report = db.query(TeamReport).filter(TeamReport.team_report_id == team_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Team report not found")

    for key, value in report_data.items():
        setattr(report, key, value)

    db.commit()
    db.refresh(report)
    return report


@router.delete("/{team_report_id}")
def delete_team_report(team_report_id: int, db: Session = Depends(get_db)):
    """Delete a team report"""
    report = db.query(TeamReport).filter(TeamReport.team_report_id == team_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Team report not found")

    db.delete(report)
    db.commit()
    return {"message": "Team report deleted successfully"}


@router.get("/team/{team_id}/members")
def get_team_members_summary(
    team_id: int,
    week_start: date = None,
    db: Session = Depends(get_db)
):
    """Get team members with their weekly summaries for dashboard"""
    # Get all users in the team
    members = db.query(UserAccount).filter(UserAccount.team_id == team_id).all()

    if not members:
        raise HTTPException(status_code=404, detail="No members found for this team")

    result = []
    for member in members:
        member_data = {
            "user_id": member.user_id,
            "name": member.name,
            "email": member.email,
            "role_id": member.role_id,
        }

        # If week_start is provided, get the weekly report for that week
        if week_start:
            weekly_report = db.query(WeeklyReport).filter(
                WeeklyReport.user_id == member.user_id,
                WeeklyReport.week_start == week_start
            ).first()

            if weekly_report:
                member_data["weekly_summary"] = {
                    "total_actions": weekly_report.total_actions,
                    "total_minutes": weekly_report.total_minutes,
                    "project_time": weekly_report.project_time,
                    "daily_stats": weekly_report.daily_stats,
                    "published": weekly_report.published
                }
            else:
                member_data["weekly_summary"] = None

        result.append(member_data)

    return {
        "team_id": team_id,
        "members": result
    }


@router.get("/team/{team_id}/activity")
def get_team_member_activity(
    team_id: int,
    user_id: int = None,
    week_start: date = None,
    db: Session = Depends(get_db)
):
    """Get detailed activity logs for team members (drilldown for individual member activity)"""
    # Verify team exists by checking if any members belong to it
    team_members = db.query(UserAccount).filter(UserAccount.team_id == team_id).all()

    if not team_members:
        raise HTTPException(status_code=404, detail="Team not found or has no members")

    # Build query for activity logs
    query = db.query(ActivityLog).join(UserAccount).filter(UserAccount.team_id == team_id)

    # Filter by specific user if provided
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)

    # Filter by week if provided
    if week_start:
        # Calculate week end (7 days from start)
        from datetime import timedelta
        week_end = week_start + timedelta(days=7)
        query = query.filter(
            ActivityLog.event_time >= week_start,
            ActivityLog.event_time < week_end
        )

    # Order by most recent first
    activities = query.order_by(ActivityLog.event_time.desc()).limit(500).all()

    # Format the response
    result = []
    for activity in activities:
        user = db.query(UserAccount).filter(UserAccount.user_id == activity.user_id).first()
        result.append({
            "log_id": activity.log_id,
            "user_id": activity.user_id,
            "user_name": user.name if user else None,
            "tool_id": activity.tool_id,
            "template_id": activity.template_id,
            "event_time": activity.event_time,
            "minutes": activity.minutes,
            "title": activity.title,
            "metadata": activity.metadata_json,
            "status": activity.status
        })

    return {
        "team_id": team_id,
        "user_id": user_id,
        "week_start": week_start,
        "activity_count": len(result),
        "activities": result
    }
