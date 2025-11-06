import random
from datetime import datetime, timedelta, date
from faker import Faker
from sqlalchemy import text
from db import SessionLocal, engine
import json
fake = Faker()
session = SessionLocal()

# Clear tables first (optional, careful in prod!)
tables = [
    "Notification", "Meeting_Summary", "Team_Report", "Weekly_Report",
    "Daily_Summary", "Activity_Log", "Action_Template", "Tool",
    "User_Account", "Team", "Role", "Organization"
]
for table in tables:
    session.execute(text(f"DELETE FROM {table}"))
session.commit()

# 1. Organizations
orgs = []
for _ in range(2):
    org = {
        "name": fake.company(),
        "subdomain": fake.domain_word(),
        "settings": json.dumps({}),
        "created_at": datetime.utcnow()
    }
    result = session.execute(
        text(
            "INSERT INTO Organization (name, subdomain, settings, created_at) "
            "VALUES (:name, :subdomain, :settings, :created_at) RETURNING org_id"
        ),
        org
    )
    org_id = result.fetchone()[0]
    org["org_id"] = org_id
    orgs.append(org)
session.commit()

# 2. Roles
roles_data = [
    {"name": "Developer", "department": "Engineering", "default_tools": ["GitHub"]},
    {"name": "Designer", "department": "UI/UX", "default_tools": ["Figma"]},
    {"name": "Project Manager", "department": "Management", "default_tools": ["Trello", "Slack"]},
    {"name": "Sales", "department": "Sales", "default_tools": ["WhatsApp", "Zoom"]},
    {"name": "Marketing", "department": "Marketing", "default_tools": ["FB", "IG", "TikTok"]},
]

roles = []
for r in roles_data:
    r["default_tools"] = json.dumps(r["default_tools"])
    r["created_at"] = datetime.utcnow()
    result = session.execute(
        text(
            "INSERT INTO Role (name, department, default_tools, created_at) "
            "VALUES (:name, :department, :default_tools, :created_at) RETURNING role_id"
        ),
        r
    )
    r["role_id"] = result.fetchone()[0]
    roles.append(r)
session.commit()

# 3. Teams
teams = []
for org in orgs:
    for i in range(random.randint(1, 3)):
        team = {
            "org_id": org["org_id"],
            "name": f"{fake.color_name()} Team",
            "invite_code": fake.bothify(text="????-####"),
            "members": json.dumps([]),
            "manager_id": None,  # will assign after users
            "created_at": datetime.utcnow()
        }
        result = session.execute(
            text(
                "INSERT INTO Team (org_id, name, invite_code, members, manager_id, created_at) "
                "VALUES (:org_id, :name, :invite_code, :members, :manager_id, :created_at) RETURNING team_id"
            ),
            team
        )
        team["team_id"] = result.fetchone()[0]
        teams.append(team)
session.commit()

# 4. Tools
tools_data = [
    {"name": "GitHub", "category": "code", "integration_type": "API"},
    {"name": "Figma", "category": "design", "integration_type": "API"},
    {"name": "Slack", "category": "communication", "integration_type": "Webhook"},
    {"name": "Zoom", "category": "communication", "integration_type": "API"},
    {"name": "Trello", "category": "project", "integration_type": "API"},
]
tools = []
for t in tools_data:
    t["config"] = json.dumps({})
    t["active"] = True
    result = session.execute(
        text(
            "INSERT INTO Tool (name, category, integration_type, config, active) "
            "VALUES (:name, :category, :integration_type, :config, :active) RETURNING tool_id"
        ),
        t
    )
    t["tool_id"] = result.fetchone()[0]
    tools.append(t)
session.commit()

users = []
for team in teams:
    for _ in range(random.randint(3, 5)):
        role = random.choice(roles)
        user = {
            "org_id": team["org_id"],
            "team_id": team["team_id"],
            "role_id": role["role_id"],
            "email": fake.email(),
            "name": fake.name(),
            "password_hash": fake.sha256(),
            "timezone": fake.timezone(),
            "privacy_settings": json.dumps({}),
            "tool_connections": json.dumps({}),
            "devices": json.dumps({}),
            "tracking_enabled": True,
            "last_login": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "deleted_at": None
        }
        result = session.execute(
            text(
                "INSERT INTO User_Account (org_id, team_id, role_id, email, name, password_hash, timezone, "
                "privacy_settings, tool_connections, devices, tracking_enabled, last_login, created_at, deleted_at) "
                "VALUES (:org_id, :team_id, :role_id, :email, :name, :password_hash, :timezone, "
                ":privacy_settings, :tool_connections, :devices, :tracking_enabled, :last_login, :created_at, :deleted_at) "
                "RETURNING user_id"
            ),
            user
        )
        user["user_id"] = result.fetchone()[0]
        users.append(user)
session.commit()

# 6. Action_Templates
action_templates = []
for role in roles:
    relevant_tools = [t for t in tools if t["name"] in json.loads(role["default_tools"])]
    for tool in relevant_tools:
        template = {
            "role_id": role["role_id"],
            "tool_id": tool["tool_id"],
            "action_type": f"Complete {tool['name']} action",
            "display_name": f"{role['name']} {tool['name']} Task",
            "default_minutes": random.randint(15, 120),
            "weight": random.randint(1, 10),
            "active": True
        }
        result = session.execute(
            text(
                "INSERT INTO Action_Template (role_id, tool_id, action_type, display_name, default_minutes, weight, active) "
                "VALUES (:role_id, :tool_id, :action_type, :display_name, :default_minutes, :weight, :active) RETURNING template_id"
            ),
            template
        )
        template["template_id"] = result.fetchone()[0]
        action_templates.append(template)
session.commit()

# 7. Activity_Logs (replace user references)
activity_logs = []
for user in users:
    # Get templates for this user's role
    user_templates = [t for t in action_templates if t["role_id"] == user["role_id"]]
    
    # Skip if no templates exist for this role
    if not user_templates:
        continue
    
    for _ in range(random.randint(5, 15)):
        template = random.choice(user_templates)
        log_time = datetime.utcnow() - timedelta(days=random.randint(0, 6), hours=random.randint(0, 23))
        log = {
            "user_id": user["user_id"],
            "tool_id": template["tool_id"],
            "template_id": template["template_id"],
            "event_time": log_time,
            "minutes": template["default_minutes"],
            "title": template["display_name"],
            "metadata": "{}",
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        session.execute(
            text(
                "INSERT INTO Activity_Log (user_id, tool_id, template_id, event_time, minutes, title, metadata, status, created_at) "
                "VALUES (:user_id, :tool_id, :template_id, :event_time, :minutes, :title, :metadata, :status, :created_at)"
            ),
            log
        )
        activity_logs.append(log)

session.commit()

for user in users:
    for i in range(7):
        day = date.today() - timedelta(days=i)
        user_logs = [l for l in activity_logs if l["user_id"] == user["user_id"] and l["event_time"].date() == day]
        summary = {
            "user_id": user["user_id"],
            "summary_date": day,
            "ai_summary": f"{len(user_logs)} tasks completed",
            "total_actions": len(user_logs),
            "total_minutes": sum(l["minutes"] for l in user_logs),
            "breakdown": "{}",
            "submitted": True,
            "created_at": datetime.utcnow()
        }
        session.execute(
            text(
                "INSERT INTO Daily_Summary (user_id, summary_date, ai_summary, total_actions, total_minutes, breakdown, submitted, created_at) "
                "VALUES (:user_id, :summary_date, :ai_summary, :total_actions, :total_minutes, :breakdown, :submitted, :created_at)"
            ),
            summary
        )
session.commit()

# 8. DailySummaries
for user in users:
    for i in range(7):
        day = date.today() - timedelta(days=i)
        user_logs = [l for l in activity_logs if l["user_id"] == user["user_id"] and l["event_time"].date() == day]
        summary = {
            "user_id": user["user_id"],
            "summary_date": day,
            "ai_summary": f"{len(user_logs)} tasks completed",
            "total_actions": len(user_logs),
            "total_minutes": sum(l["minutes"] for l in user_logs),
            "breakdown": "{}",
            "submitted": True,
            "created_at": datetime.utcnow()
        }
        session.execute(
            text(
                "INSERT INTO Daily_Summary (user_id, summary_date, ai_summary, total_actions, total_minutes, breakdown, submitted, created_at) "
                "VALUES (:user_id, :summary_date, :ai_summary, :total_actions, :total_minutes, :breakdown, :submitted, :created_at)"
            ),
            summary
        )
session.commit()

# 9. Weekly_Reports
for user in users:
    week_start = date.today() - timedelta(days=date.today().weekday())
    user_logs = [l for l in activity_logs if l["user_id"] == user["user_id"] and l["event_time"].date() >= week_start]
    report = {
        "user_id": user["user_id"],
        "week_start": week_start,
        "total_actions": len(user_logs),
        "total_minutes": sum(l["minutes"] for l in user_logs),
        "project_time": "{}",
        "daily_stats": "{}",
        "published": True,
        "created_at": datetime.utcnow()
    }
    session.execute(
        text(
            "INSERT INTO Weekly_Report (user_id, week_start, total_actions, total_minutes, project_time, daily_stats, published, created_at) "
            "VALUES (:user_id, :week_start, :total_actions, :total_minutes, :project_time, :daily_stats, :published, :created_at)"
        ),
        report
    )
session.commit()

# 10. Team_Reports
for team in teams:
    week_start = date.today() - timedelta(days=date.today().weekday())
    member_reports = [r for r in users if r["team_id"] == team["team_id"]]
    team_report = {
        "team_id": team["team_id"],
        "week_start": week_start,
        "ai_summary": f"Team {team['name']} completed activities",
        "team_stats": "{}",
        "member_reports": "{}",
        "created_at": datetime.utcnow()
    }
    session.execute(
        text(
            "INSERT INTO Team_Report (team_id, week_start, ai_summary, team_stats, member_reports, created_at) "
            "VALUES (:team_id, :week_start, :ai_summary, :team_stats, :member_reports, :created_at)"
        ),
        team_report
    )
session.commit()

# 11. Meeting_Summaries
for user in users:
    tool = random.choice(tools)
    meeting_date = datetime.utcnow().date() - timedelta(days=random.randint(0, 6))
    meeting = {
        "user_id": user["user_id"],
        "tool_id": tool["tool_id"],
        "meeting_date": meeting_date,
        "title": f"{tool['name']} meeting",
        "ai_summary": "Discussed project progress",
        "decisions": "{}",
        "action_items": "{}",
        "approved": True,
        "created_at": datetime.utcnow()
    }
    session.execute(
        text(
            "INSERT INTO Meeting_Summary (user_id, tool_id, meeting_date, title, ai_summary, decisions, action_items, approved, created_at) "
            "VALUES (:user_id, :tool_id, :meeting_date, :title, :ai_summary, :decisions, :action_items, :approved, :created_at)"
        ),
        meeting
    )
session.commit()

# 12. Notifications
for user in users:
    notif = {
        "user_id": user["user_id"],
        "type": "weekly_report",
        "message": "Your weekly report is ready",
        "data": "{}",
        "read": False,
        "created_at": datetime.utcnow()
    }
    session.execute(
        text(
            "INSERT INTO Notification (user_id, type, message, data, read, created_at) "
            "VALUES (:user_id, :type, :message, :data, :read, :created_at)"
        ),
        notif
    )
session.commit()