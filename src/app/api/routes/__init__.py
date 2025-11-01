"""
API Routes Module

This module exports all the API routers for the FocusFlow application.
Each router handles CRUD operations for its respective database table.
"""

from . import activity_logs
from . import daily_summaries
from . import weekly_reports
from . import team_reports
from . import meetings
from . import notifications
from . import organizations
from . import teams
from . import roles
from . import tools
from . import action_templates
from . import users
from . import integrations
from . import calendar

__all__ = [
    "activity_logs",
    "daily_summaries",
    "weekly_reports",
    "team_reports",
    "meetings",
    "notifications",
    "organizations",
    "teams",
    "roles",
    "tools",
    "action_templates",
    "users",
    "integrations",
    "calendar",
]
