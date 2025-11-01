from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, JSON, TIMESTAMP, Date, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base

# =========================================================
# ORGANIZATION
# =========================================================
class Organization(Base):
    __tablename__ = "organization"

    org_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subdomain = Column(String, unique=True, nullable=False)
    settings = Column(JSON, default={})
    created_at = Column(TIMESTAMP, server_default=func.now())


# =========================================================
# TEAM
# =========================================================
class Team(Base):
    __tablename__ = "team"

    team_id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organization.org_id"), nullable=False)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True)
    members = Column(JSON, default={})
    manager_id = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())

    organization = relationship("Organization", backref="teams")


# =========================================================
# ROLE
# =========================================================
class Role(Base):
    __tablename__ = "role"

    role_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    department = Column(String)
    default_tools = Column(JSON, default={})
    created_at = Column(TIMESTAMP, server_default=func.now())


# =========================================================
# USER ACCOUNT
# =========================================================
class UserAccount(Base):
    __tablename__ = "user_account"

    user_id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organization.org_id"), nullable=False)
    team_id = Column(Integer, ForeignKey("team.team_id"))
    role_id = Column(Integer, ForeignKey("role.role_id"))
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    timezone = Column(String)
    privacy_settings = Column(JSON, default={})
    tool_connections = Column(JSON, default={})
    devices = Column(JSON, default={})
    tracking_enabled = Column(Boolean, default=True)
    last_login = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    deleted_at = Column(TIMESTAMP)
    clerk_id = Column(Text)

    organization = relationship("Organization", backref="users")
    team = relationship("Team")
    role = relationship("Role", backref="users")


# =========================================================
# TOOL
# =========================================================
class Tool(Base):
    __tablename__ = "tool"

    tool_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String)
    integration_type = Column(String)
    config = Column(JSON, default={})
    active = Column(Boolean, default=True)


# =========================================================
# ACTION TEMPLATE
# =========================================================
class ActionTemplate(Base):
    __tablename__ = "action_template"

    template_id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("role.role_id"))
    tool_id = Column(Integer, ForeignKey("tool.tool_id"))
    action_type = Column(String, unique=True, nullable=False)
    display_name = Column(String)
    default_minutes = Column(Integer, default=0)
    weight = Column(Integer, default=0)
    active = Column(Boolean, default=True)

    role = relationship("Role", backref="action_templates")
    tool = relationship("Tool", backref="action_templates")


# =========================================================
# ACTIVITY LOG
# =========================================================
class ActivityLog(Base):
    __tablename__ = "activity_log"

    log_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tool.tool_id"))
    template_id = Column(Integer, ForeignKey("action_template.template_id"))
    event_time = Column(TIMESTAMP, server_default=func.now())
    minutes = Column(Integer)
    title = Column(String)
    metadata_json = Column("metadata", JSON, default={})
    status = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("UserAccount", backref="activity_logs")
    tool = relationship("Tool", backref="activity_logs")
    template = relationship("ActionTemplate", backref="activity_logs")


# =========================================================
# DAILY SUMMARY
# =========================================================
class DailySummary(Base):
    __tablename__ = "daily_summary"

    summary_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    summary_date = Column(Date, nullable=False)
    ai_summary = Column(Text)
    total_actions = Column(Integer)
    total_minutes = Column(Integer)
    breakdown = Column(JSON, default={})
    submitted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("UserAccount", backref="daily_summaries")


# =========================================================
# WEEKLY REPORT
# =========================================================
class WeeklyReport(Base):
    __tablename__ = "weekly_report"

    report_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    week_start = Column(Date, nullable=False)
    total_actions = Column(Integer)
    total_minutes = Column(Integer)
    project_time = Column(JSON, default={})
    daily_stats = Column(JSON, default={})
    published = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("UserAccount", backref="weekly_reports")


# =========================================================
# TEAM REPORT
# =========================================================
class TeamReport(Base):
    __tablename__ = "team_report"

    team_report_id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("team.team_id"), nullable=False)
    week_start = Column(Date, nullable=False)
    ai_summary = Column(Text)
    team_stats = Column(JSON, default={})
    member_reports = Column(JSON, default={})
    created_at = Column(TIMESTAMP, server_default=func.now())

    team = relationship("Team", backref="team_reports")


# =========================================================
# MEETING SUMMARY
# =========================================================
class MeetingSummary(Base):
    __tablename__ = "meeting_summary"

    meeting_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tool.tool_id"))
    meeting_date = Column(Date)
    title = Column(String)
    ai_summary = Column(Text)
    decisions = Column(JSON, default={})
    action_items = Column(JSON, default={})
    approved = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("UserAccount", backref="meeting_summaries")
    tool = relationship("Tool", backref="meeting_summaries")


# =========================================================
# NOTIFICATION
# =========================================================
class Notification(Base):
    __tablename__ = "notification"

    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.user_id"), nullable=False)
    type = Column(String)
    message = Column(Text)
    data = Column(JSON, default={})
    read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("UserAccount", backref="notifications")
