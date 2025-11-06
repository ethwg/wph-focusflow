"""
COMPREHENSIVE Test Suite for ALL FocusFlow API Endpoints

This script tests every endpoint across all 12+ table groups.

Before running:
1. Ensure the FastAPI server is running (uvicorn main:app --reload)
2. Update the CONFIG section below with your test data
3. Install required package: pip install requests
"""

import requests
from datetime import date, datetime, timedelta
import json

# ============================================================================
# CONFIGURATION - UPDATE THESE WITH YOUR DATABASE VALUES
# ============================================================================

BASE_URL = "http://localhost:8000"

CONFIG = {
    # === Existing IDs from your database ===
    "existing_user_id": 289,
    "existing_team_id": 85,
    "existing_org_id": 41,
    "existing_role_id": 72,
    "existing_tool_id": 61,
    "existing_action_template_id": 1,
    "existing_activity_log_id": 1302,
    "existing_daily_summary_id": 1,
    "existing_weekly_report_id": 1,
    "existing_team_report_id": 1,
    "existing_meeting_id": 1,
    "existing_notification_id": 1,

    # === Date/time for testing ===
    "test_week_start": "2025-11-01",  # Monday
    "test_date": "2025-11-01",

    # === New data for creation tests ===
    "new_org_name": "Test Organization",
    "new_org_subdomain": "testorg123",
    "new_team_name": "Test Team",
    "new_role_name": "Test Role",
    "new_tool_name": "Test Tool",
    "new_user_email": "testuser@example.com",
    "new_user_name": "Test User",
    "new_user_password": "hashed_password_123",

    # === Integration testing ===
    "integration_access_token": "test_access_token_xyz",
    "integration_refresh_token": "test_refresh_token_abc",
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

OUTPUT_FILE = "api_test_results.md"

def write_md(text):
    """Append text to the markdown output file"""
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(text + "\n")

def print_section(title):
    """Write a formatted section header"""
    write_md("\n" + "="*80)
    write_md(f"## {title}")
    write_md("="*80 + "\n")
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")

def print_test(endpoint, method):
    """Write test info"""
    write_md(f"\n### [{method}] {endpoint}\n")
    write_md("-" * 80)
    print(f"\n[{method}] {endpoint}")
    print("-" * 80)

def print_response(response):
    """Write formatted response"""
    status_emoji = "✅" if response.status_code < 400 else "❌"
    write_md(f"**Status:** {response.status_code} {status_emoji}")
    print(f"Status: {response.status_code} {status_emoji}")

    try:
        json_text = json.dumps(response.json(), indent=2)
        write_md(f"```json\n{json_text}\n```")
        # Print only first 500 chars to console
        print(f"Response: {json_text[:500]}{'...' if len(json_text) > 500 else ''}")
    except:
        write_md(f"```text\n{response.text}\n```")
        print(f"Response: {response.text[:500]}")
    write_md("\n")
    print()

# ============================================================================
# 1. ORGANIZATIONS
# ============================================================================

def test_organizations():
    print_section("1. ORGANIZATIONS")

    # GET all organizations
    print_test("/organizations/", "GET")
    response = requests.get(f"{BASE_URL}/organizations/", params={"limit": 5})
    print_response(response)

    # GET specific organization
    print_test(f"/organizations/{CONFIG['existing_org_id']}", "GET")
    response = requests.get(f"{BASE_URL}/organizations/{CONFIG['existing_org_id']}")
    print_response(response)

    # POST create organization
    print_test("/organizations/", "POST")
    org_data = {
        "name": CONFIG["new_org_name"],
        "subdomain": CONFIG["new_org_subdomain"],
        "settings": {"theme": "dark", "timezone": "UTC"}
    }
    response = requests.post(f"{BASE_URL}/organizations/", json=org_data)
    print_response(response)

    if response.status_code == 200:
        CONFIG["created_org_id"] = response.json()["org_id"]

    # PUT update organization
    if "created_org_id" in CONFIG:
        print_test(f"/organizations/{CONFIG['created_org_id']}", "PUT")
        update_data = {
            "name": "Updated Test Organization",
            "subdomain": CONFIG["new_org_subdomain"],
            "settings": {"theme": "light"}
        }
        response = requests.put(f"{BASE_URL}/organizations/{CONFIG['created_org_id']}", json=update_data)
        print_response(response)

# ============================================================================
# 2. TEAMS
# ============================================================================

def test_teams():
    print_section("2. TEAMS")

    # GET all teams
    print_test("/teams/", "GET")
    response = requests.get(f"{BASE_URL}/teams/", params={"limit": 5})
    print_response(response)

    # GET specific team
    print_test(f"/teams/{CONFIG['existing_team_id']}", "GET")
    response = requests.get(f"{BASE_URL}/teams/{CONFIG['existing_team_id']}")
    print_response(response)

    # POST create team
    print_test("/teams/", "POST")
    team_data = {
        "org_id": CONFIG["existing_org_id"],
        "name": CONFIG["new_team_name"],
        "invite_code": "TEST123",
        "members": {},
        "manager_id": CONFIG["existing_user_id"]
    }
    response = requests.post(f"{BASE_URL}/teams/", json=team_data)
    print_response(response)

    if response.status_code == 200:
        CONFIG["created_team_id"] = response.json()["team_id"]

    # PUT update team
    if "created_team_id" in CONFIG:
        print_test(f"/teams/{CONFIG['created_team_id']}", "PUT")
        update_data = {
            "org_id": CONFIG["existing_org_id"],
            "name": "Updated Test Team",
            "invite_code": "TEST456"
        }
        response = requests.put(f"{BASE_URL}/teams/{CONFIG['created_team_id']}", json=update_data)
        print_response(response)

    # GET team members
    print_test(f"/teams/{CONFIG['existing_team_id']}/members", "GET")
    response = requests.get(f"{BASE_URL}/teams/{CONFIG['existing_team_id']}/members")
    print_response(response)

# ============================================================================
# 3. ROLES
# ============================================================================

def test_roles():
    print_section("3. ROLES")

    # GET all roles
    print_test("/roles/", "GET")
    response = requests.get(f"{BASE_URL}/roles/", params={"limit": 5})
    print_response(response)

    # GET specific role
    print_test(f"/roles/{CONFIG['existing_role_id']}", "GET")
    response = requests.get(f"{BASE_URL}/roles/{CONFIG['existing_role_id']}")
    print_response(response)

    # POST create role
    print_test("/roles/", "POST")
    role_data = {
        "name": CONFIG["new_role_name"],
        "department": "Engineering",
        "default_tools": {"slack": True, "github": True}
    }
    response = requests.post(f"{BASE_URL}/roles/", json=role_data)
    print_response(response)

    if response.status_code == 200:
        CONFIG["created_role_id"] = response.json()["role_id"]

    # PUT update role
    if "created_role_id" in CONFIG:
        print_test(f"/roles/{CONFIG['created_role_id']}", "PUT")
        update_data = {
            "name": "Updated Test Role",
            "department": "Product"
        }
        response = requests.put(f"{BASE_URL}/roles/{CONFIG['created_role_id']}", json=update_data)
        print_response(response)

# ============================================================================
# 4. TOOLS
# ============================================================================

def test_tools():
    print_section("4. TOOLS")

    # GET all tools
    print_test("/tools/", "GET")
    response = requests.get(f"{BASE_URL}/tools/", params={"limit": 5})
    print_response(response)

    # GET specific tool
    print_test(f"/tools/{CONFIG['existing_tool_id']}", "GET")
    response = requests.get(f"{BASE_URL}/tools/{CONFIG['existing_tool_id']}")
    print_response(response)

    # POST create tool
    print_test("/tools/", "POST")
    tool_data = {
        "name": CONFIG["new_tool_name"],
        "category": "Development",
        "integration_type": "oauth",
        "config": {"api_version": "v2"},
        "active": True
    }
    response = requests.post(f"{BASE_URL}/tools/", json=tool_data)
    print_response(response)

    if response.status_code == 200:
        CONFIG["created_tool_id"] = response.json()["tool_id"]

    # PUT update tool
    if "created_tool_id" in CONFIG:
        print_test(f"/tools/{CONFIG['created_tool_id']}", "PUT")
        update_data = {
            "name": "Updated Test Tool",
            "category": "Communication",
            "active": True
        }
        response = requests.put(f"{BASE_URL}/tools/{CONFIG['created_tool_id']}", json=update_data)
        print_response(response)

# ============================================================================
# 5. ACTION TEMPLATES
# ============================================================================

def test_action_templates():
    print_section("5. ACTION TEMPLATES")

    # GET all action templates
    print_test("/action-templates/", "GET")
    response = requests.get(f"{BASE_URL}/action-templates/", params={"limit": 5})
    print_response(response)

    # GET specific action template
    print_test(f"/action-templates/{CONFIG['existing_action_template_id']}", "GET")
    response = requests.get(f"{BASE_URL}/action-templates/{CONFIG['existing_action_template_id']}")
    print_response(response)

    # POST create action template
    print_test("/action-templates/", "POST")
    template_data = {
        "role_id": CONFIG["existing_role_id"],
        "tool_id": CONFIG["existing_tool_id"],
        "action_type": "test_action",
        "display_name": "Test Action",
        "default_minutes": 30,
        "weight": 5,
        "active": True
    }
    response = requests.post(f"{BASE_URL}/action-templates/", json=template_data)
    print_response(response)

    if response.status_code == 200:
        CONFIG["created_template_id"] = response.json()["template_id"]

    # PUT update action template
    if "created_template_id" in CONFIG:
        print_test(f"/action-templates/{CONFIG['created_template_id']}", "PUT")
        update_data = {
            "role_id": CONFIG["existing_role_id"],
            "tool_id": CONFIG["existing_tool_id"],
            "action_type": "test_action",
            "display_name": "Updated Test Action",
            "default_minutes": 45
        }
        response = requests.put(f"{BASE_URL}/action-templates/{CONFIG['created_template_id']}", json=update_data)
        print_response(response)

# ============================================================================
# 6. USER ACCOUNTS
# ============================================================================

def test_users():
    print_section("6. USER ACCOUNTS")

    # GET all users
    print_test("/users/", "GET")
    response = requests.get(f"{BASE_URL}/users/", params={"limit": 5})
    print_response(response)

    # GET specific user
    print_test(f"/users/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/users/{CONFIG['existing_user_id']}")
    print_response(response)

    # POST create user
    print_test("/users/", "POST")
    user_data = {
        "email": CONFIG["new_user_email"],
        "name": CONFIG["new_user_name"],
        "password_hash": CONFIG["new_user_password"],
        "org_id": CONFIG["existing_org_id"],
        "timezone": "America/New_York",
        "tracking_enabled": True
    }
    response = requests.post(f"{BASE_URL}/users/", json=user_data)
    print_response(response)

    if response.status_code == 200:
        CONFIG["created_user_id"] = response.json()["user_id"]

    # PUT update user
    if "created_user_id" in CONFIG:
        print_test(f"/users/{CONFIG['created_user_id']}", "PUT")
        update_data = {
            "name": "Updated Test User",
            "timezone": "America/Los_Angeles"
        }
        response = requests.put(f"{BASE_URL}/users/{CONFIG['created_user_id']}", json=update_data)
        print_response(response)

# ============================================================================
# 7. ACTIVITY LOGS
# ============================================================================

def test_activity_logs():
    print_section("7. ACTIVITY LOGS")

    # GET all activity logs
    print_test("/activity-logs/", "GET")
    response = requests.get(f"{BASE_URL}/activity-logs/", params={"limit": 5})
    print_response(response)

    # GET user's activity logs
    print_test(f"/activity-logs/user/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/activity-logs/user/{CONFIG['existing_user_id']}", params={"limit": 5})
    print_response(response)

    # GET specific activity log
    print_test(f"/activity-logs/{CONFIG['existing_activity_log_id']}", "GET")
    response = requests.get(f"{BASE_URL}/activity-logs/{CONFIG['existing_activity_log_id']}")
    print_response(response)

    # POST create activity log
    print_test("/activity-logs/", "POST")
    activity_data = {
        "user_id": CONFIG["existing_user_id"],
        "tool_id": CONFIG["existing_tool_id"],
        "minutes": 30,
        "title": "Test Activity",
        "metadata": {"project": "Test Project"},
        "status": "completed"
    }
    response = requests.post(f"{BASE_URL}/activity-logs/", json=activity_data)
    print_response(response)

# ============================================================================
# 8. DAILY SUMMARIES
# ============================================================================

def test_daily_summaries():
    print_section("8. DAILY SUMMARIES")

    # GET all daily summaries
    print_test("/daily-summaries/", "GET")
    response = requests.get(f"{BASE_URL}/daily-summaries/", params={"limit": 5})
    print_response(response)

    # GET user's daily summaries
    print_test(f"/daily-summaries/user/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/daily-summaries/user/{CONFIG['existing_user_id']}", params={"limit": 5})
    print_response(response)

    # GET specific daily summary
    if CONFIG.get("existing_daily_summary_id"):
        print_test(f"/daily-summaries/{CONFIG['existing_daily_summary_id']}", "GET")
        response = requests.get(f"{BASE_URL}/daily-summaries/{CONFIG['existing_daily_summary_id']}")
        print_response(response)

    # POST create daily summary
    print_test("/daily-summaries/", "POST")
    summary_data = {
        "user_id": CONFIG["existing_user_id"],
        "summary_date": CONFIG["test_date"],
        "ai_summary": "Test daily summary",
        "total_actions": 10,
        "total_minutes": 300,
        "breakdown": {"development": 180, "meetings": 120},
        "submitted": False
    }
    response = requests.post(f"{BASE_URL}/daily-summaries/", json=summary_data)
    print_response(response)

# ============================================================================
# 9. WEEKLY REPORTS
# ============================================================================

def test_weekly_reports():
    print_section("9. WEEKLY REPORTS")

    # GET all weekly reports
    print_test("/weekly-reports/", "GET")
    response = requests.get(f"{BASE_URL}/weekly-reports/", params={"limit": 5})
    print_response(response)

    # GET user's weekly reports
    print_test(f"/weekly-reports/user/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/weekly-reports/user/{CONFIG['existing_user_id']}", params={"limit": 5})
    print_response(response)

    # GET specific weekly report
    if CONFIG.get("existing_weekly_report_id"):
        print_test(f"/weekly-reports/{CONFIG['existing_weekly_report_id']}", "GET")
        response = requests.get(f"{BASE_URL}/weekly-reports/{CONFIG['existing_weekly_report_id']}")
        print_response(response)

    # POST create weekly report
    print_test("/weekly-reports/", "POST")
    report_data = {
        "user_id": CONFIG["existing_user_id"],
        "week_start": CONFIG["test_week_start"],
        "total_actions": 50,
        "total_minutes": 1500,
        "project_time": {"project_a": 900, "project_b": 600},
        "daily_stats": {},
        "published": False
    }
    response = requests.post(f"{BASE_URL}/weekly-reports/", json=report_data)
    print_response(response)

# ============================================================================
# 10. TEAM REPORTS
# ============================================================================

def test_team_reports():
    print_section("10. TEAM REPORTS")

    # GET all team reports
    print_test("/team-reports/", "GET")
    response = requests.get(f"{BASE_URL}/team-reports/", params={"limit": 5})
    print_response(response)

    # GET team's reports
    print_test(f"/team-reports/?team_id={CONFIG['existing_team_id']}", "GET")
    response = requests.get(f"{BASE_URL}/team-reports/", params={"team_id": CONFIG['existing_team_id'], "limit": 5})
    print_response(response)

    # GET team members summary
    print_test(f"/team-reports/team/{CONFIG['existing_team_id']}/members", "GET")
    response = requests.get(f"{BASE_URL}/team-reports/team/{CONFIG['existing_team_id']}/members")
    print_response(response)

    # GET team member activity
    print_test(f"/team-reports/team/{CONFIG['existing_team_id']}/activity", "GET")
    response = requests.get(f"{BASE_URL}/team-reports/team/{CONFIG['existing_team_id']}/activity", params={"limit": 10})
    print_response(response)

    # POST create team report
    print_test("/team-reports/", "POST")
    team_report_data = {
        "team_id": CONFIG["existing_team_id"],
        "week_start": CONFIG["test_week_start"],
        "ai_summary": "Team performed well this week",
        "team_stats": {"total_hours": 160},
        "member_reports": {}
    }
    response = requests.post(f"{BASE_URL}/team-reports/", json=team_report_data)
    print_response(response)

# ============================================================================
# 11. MEETINGS
# ============================================================================

def test_meetings():
    print_section("11. MEETINGS")

    # GET all meetings
    print_test("/meetings/", "GET")
    response = requests.get(f"{BASE_URL}/meetings/", params={"limit": 5})
    print_response(response)

    # GET user's meetings
    print_test(f"/meetings/user/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/meetings/user/{CONFIG['existing_user_id']}", params={"limit": 5})
    print_response(response)

    # GET specific meeting
    if CONFIG.get("existing_meeting_id"):
        print_test(f"/meetings/{CONFIG['existing_meeting_id']}", "GET")
        response = requests.get(f"{BASE_URL}/meetings/{CONFIG['existing_meeting_id']}")
        print_response(response)

    # POST create meeting
    print_test("/meetings/", "POST")
    meeting_data = {
        "user_id": CONFIG["existing_user_id"],
        "tool_id": CONFIG["existing_tool_id"],
        "meeting_date": CONFIG["test_date"],
        "title": "Test Meeting",
        "ai_summary": "Discussed project timeline",
        "decisions": {"decision_1": "Proceed with plan A"},
        "action_items": {"item_1": "Complete design by Friday"},
        "approved": False
    }
    response = requests.post(f"{BASE_URL}/meetings/", json=meeting_data)
    print_response(response)

# ============================================================================
# 12. NOTIFICATIONS
# ============================================================================

def test_notifications():
    print_section("12. NOTIFICATIONS")

    # GET all notifications
    print_test("/notifications/", "GET")
    response = requests.get(f"{BASE_URL}/notifications/", params={"limit": 5})
    print_response(response)

    # GET user's notifications
    print_test(f"/notifications/user/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/notifications/user/{CONFIG['existing_user_id']}", params={"limit": 5})
    print_response(response)

    # GET unread notifications
    print_test(f"/notifications/user/{CONFIG['existing_user_id']}/unread", "GET")
    response = requests.get(f"{BASE_URL}/notifications/user/{CONFIG['existing_user_id']}/unread")
    print_response(response)

    # POST create notification
    print_test("/notifications/", "POST")
    notif_data = {
        "user_id": CONFIG["existing_user_id"],
        "type": "info",
        "message": "This is a test notification",
        "data": {"action": "test"},
        "read": False
    }
    response = requests.post(f"{BASE_URL}/notifications/", json=notif_data)
    print_response(response)

    if response.status_code == 200:
        CONFIG["created_notif_id"] = response.json()["notification_id"]

    # PATCH mark as read
    if "created_notif_id" in CONFIG:
        print_test(f"/notifications/{CONFIG['created_notif_id']}/mark-read", "PATCH")
        response = requests.patch(f"{BASE_URL}/notifications/{CONFIG['created_notif_id']}/mark-read")
        print_response(response)

# ============================================================================
# 13. INTEGRATIONS
# ============================================================================

def test_integrations():
    print_section("13. INTEGRATIONS")

    # GET all integrations for user
    print_test(f"/integrations/user/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/integrations/user/{CONFIG['existing_user_id']}")
    print_response(response)

    # GET specific integration status
    print_test(f"/integrations/{CONFIG['existing_tool_id']}/user/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/integrations/{CONFIG['existing_tool_id']}/user/{CONFIG['existing_user_id']}")
    print_response(response)

    # POST connect integration
    print_test(f"/integrations/{CONFIG['existing_tool_id']}/connect", "POST")
    connect_data = {
        "user_id": CONFIG["existing_user_id"],
        "access_token": CONFIG["integration_access_token"],
        "refresh_token": CONFIG["integration_refresh_token"],
        "oauth_data": {"scope": "read,write"},
        "config": {"auto_sync": True}
    }
    response = requests.post(f"{BASE_URL}/integrations/{CONFIG['existing_tool_id']}/connect", json=connect_data)
    print_response(response)

# ============================================================================
# 14. CALENDAR
# ============================================================================

def test_calendar():
    print_section("14. CALENDAR")

    # GET user calendar for week
    print_test(f"/calendar/user/{CONFIG['existing_user_id']}/week/{CONFIG['test_week_start']}", "GET")
    response = requests.get(f"{BASE_URL}/calendar/user/{CONFIG['existing_user_id']}/week/{CONFIG['test_week_start']}")
    print_response(response)

    # GET user calendar for date
    print_test(f"/calendar/user/{CONFIG['existing_user_id']}/date/{CONFIG['test_date']}", "GET")
    response = requests.get(f"{BASE_URL}/calendar/user/{CONFIG['existing_user_id']}/date/{CONFIG['test_date']}")
    print_response(response)

    # PUT update calendar entry
    print_test(f"/calendar/{CONFIG['existing_activity_log_id']}", "PUT")
    update_data = {
        "minutes": 60,
        "title": "Updated Activity Title",
        "status": "in_progress"
    }
    response = requests.put(f"{BASE_URL}/calendar/{CONFIG['existing_activity_log_id']}", json=update_data)
    print_response(response)

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    # Clear the output file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(f"# FocusFlow API - Complete Test Results\n\n")
        f.write(f"**Base URL:** {BASE_URL}\n\n")
        f.write(f"**Test Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("---\n\n")

    print("\n" + "="*80)
    print("  FOCUSFLOW API - COMPREHENSIVE TEST SUITE")
    print("="*80)
    print(f"\nBase URL: {BASE_URL}")
    print(f"Results will be saved to: {OUTPUT_FILE}")
    print("\nTesting all 14 endpoint groups...\n")

    try:
        # Run all tests in order
        test_organizations()
        test_teams()
        test_roles()
        test_tools()
        test_action_templates()
        test_users()
        test_activity_logs()
        test_daily_summaries()
        test_weekly_reports()
        test_team_reports()
        test_meetings()
        test_notifications()
        test_integrations()
        test_calendar()

        print_section("TEST SUITE COMPLETED ✅")
        write_md(f"**Total endpoint groups tested:** 14\n")
        write_md(f"**Results saved to:** {OUTPUT_FILE}\n")

        print(f"\n✅ Test suite completed!")
        print(f"📄 Results saved to: {OUTPUT_FILE}")
        print(f"\nNote: Some DELETE operations are not included to preserve data.")

    except requests.exceptions.ConnectionError:
        error_msg = f"❌ ERROR: Could not connect to API server at {BASE_URL}"
        write_md(f"\n{error_msg}\n")
        print(f"\n{error_msg}")
        print("Make sure the server is running: uvicorn main:app --reload")
    except Exception as e:
        error_msg = f"❌ ERROR: {str(e)}"
        write_md(f"\n{error_msg}\n")
        print(f"\n{error_msg}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
