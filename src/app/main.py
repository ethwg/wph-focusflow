# src/app/api/main.py
from fastapi import FastAPI

from api.routes import (
    activity_logs,
    daily_summaries,
    weekly_reports,
    team_reports,
    meetings,
    notifications,
    organizations,
    teams,
    roles,
    tools,
    action_templates,
    users,
    integrations,
    calendar
)

app = FastAPI(title="FocusFlow API")

# Include all routers
app.include_router(activity_logs.router)
app.include_router(daily_summaries.router)
app.include_router(weekly_reports.router)
app.include_router(team_reports.router)
app.include_router(meetings.router)
app.include_router(notifications.router)
app.include_router(organizations.router)
app.include_router(teams.router)
app.include_router(roles.router)
app.include_router(tools.router)
app.include_router(action_templates.router)
app.include_router(users.router)
app.include_router(integrations.router)
app.include_router(calendar.router)


@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Welcome to FocusFlow API"}