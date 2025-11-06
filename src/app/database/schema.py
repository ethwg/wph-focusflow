from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date, datetime

# --- Tasks / Activity Logs ---
class ActivityLogSchema(BaseModel):
    log_id: int
    user_id: int
    tool_id: Optional[int]
    template_id: Optional[int]
    event_time: datetime
    minutes: Optional[int]
    title: Optional[str]
    metadata_json: Optional[Dict]
    status: Optional[str]

    class Config:
        orm_mode = True

# --- Daily Summary ---
class DailySummarySchema(BaseModel):
    summary_id: int
    user_id: int
    summary_date: date
    ai_summary: Optional[str]
    total_actions: Optional[int]
    total_minutes: Optional[int]
    breakdown: Optional[Dict]
    submitted: bool

    class Config:
        orm_mode = True

# --- Weekly Report ---
class WeeklyReportSchema(BaseModel):
    report_id: int
    user_id: int
    week_start: date
    total_actions: Optional[int]
    total_minutes: Optional[int]
    project_time: Optional[Dict]
    daily_stats: Optional[Dict]
    published: bool

    class Config:
        orm_mode = True

# --- Team Report ---
class TeamReportSchema(BaseModel):
    team_report_id: int
    team_id: int
    week_start: date
    ai_summary: Optional[str]
    team_stats: Optional[Dict]
    member_reports: Optional[Dict]

    class Config:
        orm_mode = True

# --- Meeting Summary ---
class MeetingSummarySchema(BaseModel):
    meeting_id: int
    user_id: int
    tool_id: Optional[int]
    meeting_date: Optional[date]
    title: Optional[str]
    ai_summary: Optional[str]
    decisions: Optional[Dict]
    action_items: Optional[Dict]
    approved: bool

    class Config:
        orm_mode = True

# --- Notification ---
class NotificationSchema(BaseModel):
    notification_id: int
    user_id: int
    type: Optional[str]
    message: Optional[str]
    data: Optional[Dict]
    read: bool

    class Config:
        orm_mode = True

class OrganizationBase(BaseModel):
    name: str
    subdomain: str
    settings: Optional[dict] = {}

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationRead(OrganizationBase):
    org_id: int
    created_at: datetime

    class Config:
        orm_mode = True


# =========================================================
# TEAM
# =========================================================
class TeamBase(BaseModel):
    org_id: int
    name: str
    invite_code: Optional[str]
    members: Optional[dict] = {}
    manager_id: Optional[int]

class TeamCreate(TeamBase):
    pass

class TeamRead(TeamBase):
    team_id: int
    created_at: datetime

    class Config:
        orm_mode = True


# =========================================================
# ROLE
# =========================================================
class RoleBase(BaseModel):
    name: str
    department: Optional[str]
    default_tools: Optional[dict] = {}

class RoleCreate(RoleBase):
    pass

class RoleRead(RoleBase):
    role_id: int
    created_at: datetime

    class Config:
        orm_mode = True


# =========================================================
# TOOL
# =========================================================
class ToolBase(BaseModel):
    name: str
    category: Optional[str]
    integration_type: Optional[str]
    config: Optional[dict] = {}
    active: Optional[bool] = True

class ToolCreate(ToolBase):
    pass

class ToolRead(ToolBase):
    tool_id: int

    class Config:
        orm_mode = True


# =========================================================
# ACTION TEMPLATE
# =========================================================
class ActionTemplateBase(BaseModel):
    role_id: int
    tool_id: int
    action_type: str
    display_name: Optional[str]
    default_minutes: Optional[int] = 0
    weight: Optional[int] = 0
    active: Optional[bool] = True

class ActionTemplateCreate(ActionTemplateBase):
    pass

class ActionTemplateRead(ActionTemplateBase):
    template_id: int

    class Config:
        orm_mode = True


# =========================================================
# USER ACCOUNT
# =========================================================
class UserAccountBase(BaseModel):
    email: str
    name: str
    timezone: Optional[str]
    org_id: int
    team_id: Optional[int]
    role_id: Optional[int]
    privacy_settings: Optional[dict] = {}
    tracking_enabled: Optional[bool] = True

class UserAccountCreate(UserAccountBase):
    password_hash: str

class UserAccountUpdate(BaseModel):
    name: Optional[str]
    email: Optional[str]
    timezone: Optional[str]
    team_id: Optional[int]
    role_id: Optional[int]
    privacy_settings: Optional[dict]
    tracking_enabled: Optional[bool]

class UserAccountRead(BaseModel):
    user_id: int
    org_id: int
    team_id: Optional[int]
    role_id: Optional[int]
    email: str
    name: str
    timezone: Optional[str]
    privacy_settings: Optional[dict]
    tool_connections: Optional[dict]
    tracking_enabled: bool
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True