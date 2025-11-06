"""
Test script for new FocusFlow API endpoints (No time to set up pytests and fixtures for each)

Before running this script:
1. Ensure the FastAPI server is running (uvicorn main:app --reload)
2. Update the configuration variables below with your test data
3. Install required package: pip install requests
"""

import requests
from datetime import date, datetime, timedelta
import json

# ============================================================================
# CONFIGURATION - UPDATE THESE VARIABLES EXISTING DATA (PLEASE CHECK THE SUPABASE)
# ============================================================================

# API Base URL (CHECK YOUR PORT :D)
BASE_URL = "http://localhost:8000"

# Test Data - Update these with actual IDs from your database
CONFIG = {
    # Existing data from your database (needed for GET requests)
    "existing_user_id": 289,              # An existing user ID from user_account table
    "existing_team_id": 85,              # An existing team ID from team table
    "existing_org_id": 41,               # An existing organization ID
    "existing_role_id": 72,              # An existing role ID
    "existing_tool_id": 61,              # An existing tool ID (for integrations)
    "existing_activity_log_id": 1302,      # An existing activity log ID (for calendar)

    # Week and date for calendar testing
    "test_week_start": "2025-11-01",    # Format: YYYY-MM-DD (Monday of a week)
    "test_date": "2025-11-01",          # Format: YYYY-MM-DD

    # New user data for testing (will be created during test)
    "new_user_email": "testuser@example.com",
    "new_user_name": "Test User",
    "new_user_password_hash": "hashed_password_123",

    # Integration test data
    "integration_access_token": "test_access_token_xyz",
    "integration_refresh_token": "test_refresh_token_abc",
}

# ============================================================================
# TEST FUNCTIONS
# ============================================================================

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_test(endpoint, method):
    """Print test info"""
    print(f"\n[{method}] {endpoint}")
    print("-" * 80)

def print_response(response):
    """Print formatted response"""
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print()

# ============================================================================
# 1. USER ACCOUNT ENDPOINTS
# ============================================================================

def test_users_endpoints():
    print_section("1. USER ACCOUNT ENDPOINTS")

    # GET all users
    print_test("/users/", "GET")
    response = requests.get(f"{BASE_URL}/users/", params={"limit": 5})
    print_response(response)

    # GET specific user
    print_test(f"/users/{CONFIG['existing_user_id']}", "GET")
    response = requests.get(f"{BASE_URL}/users/{CONFIG['existing_user_id']}")
    print_response(response)

    # POST create new user
    print_test("/users/", "POST")
    new_user_data = {
        "email": CONFIG["new_user_email"],
        "name": CONFIG["new_user_name"],
        "password_hash": CONFIG["new_user_password_hash"],
        "org_id": CONFIG["existing_org_id"],
        "timezone": "America/New_York",
        "tracking_enabled": True
    }
    response = requests.post(f"{BASE_URL}/users/", json=new_user_data)
    print_response(response)

    # Save created user ID for later tests
    if response.status_code == 200:
        CONFIG["created_user_id"] = response.json()["user_id"]
        print(f"✓ Created user ID: {CONFIG['created_user_id']}")

    # PUT update user (if user was created)
    if "created_user_id" in CONFIG:
        print_test(f"/users/{CONFIG['created_user_id']}", "PUT")
        update_data = {
            "name": "Updated Test User",
            "timezone": "America/Los_Angeles",
            "team_id": CONFIG["existing_team_id"]
        }
        response = requests.put(f"{BASE_URL}/users/{CONFIG['created_user_id']}", json=update_data)
        print_response(response)

    # DELETE user (soft delete)
    # Uncomment if you want to test delete
    # if "created_user_id" in CONFIG:
    #     print_test(f"/users/{CONFIG['created_user_id']}", "DELETE")
    #     response = requests.delete(f"{BASE_URL}/users/{CONFIG['created_user_id']}")
    #     print_response(response)

# ============================================================================
# 2. TEAM MEMBERS MANAGEMENT ENDPOINTS
# ============================================================================

def test_team_members_endpoints():
    print_section("2. TEAM MEMBERS MANAGEMENT ENDPOINTS")

    # GET team members
    print_test(f"/teams/{CONFIG['existing_team_id']}/members", "GET")
    response = requests.get(f"{BASE_URL}/teams/{CONFIG['existing_team_id']}/members")
    print_response(response)

    # POST add member to team (if we have a created user)
    if "created_user_id" in CONFIG:
        print_test(f"/teams/{CONFIG['existing_team_id']}/members", "POST")
        response = requests.post(
            f"{BASE_URL}/teams/{CONFIG['existing_team_id']}/members",
            params={"user_id": CONFIG["created_user_id"]}
        )
        print_response(response)

    # DELETE remove member from team
    # Uncomment if you want to test removal
    # if "created_user_id" in CONFIG:
    #     print_test(f"/teams/{CONFIG['existing_team_id']}/members/{CONFIG['created_user_id']}", "DELETE")
    #     response = requests.delete(f"{BASE_URL}/teams/{CONFIG['existing_team_id']}/members/{CONFIG['created_user_id']}")
    #     print_response(response)

# ============================================================================
# 3. TEAM REPORTS - MEMBER ACTIVITY ENDPOINTS
# ============================================================================

def test_team_reports_endpoints():
    print_section("3. TEAM REPORTS - MEMBER ACTIVITY ENDPOINTS")

    # GET team members summary
    print_test(f"/team-reports/team/{CONFIG['existing_team_id']}/members", "GET")
    response = requests.get(f"{BASE_URL}/team-reports/team/{CONFIG['existing_team_id']}/members")
    print_response(response)

    # GET team members summary with week_start
    print_test(f"/team-reports/team/{CONFIG['existing_team_id']}/members?week_start={CONFIG['test_week_start']}", "GET")
    response = requests.get(
        f"{BASE_URL}/team-reports/team/{CONFIG['existing_team_id']}/members",
        params={"week_start": CONFIG["test_week_start"]}
    )
    print_response(response)

    # GET team member activity
    print_test(f"/team-reports/team/{CONFIG['existing_team_id']}/activity", "GET")
    response = requests.get(f"{BASE_URL}/team-reports/team/{CONFIG['existing_team_id']}/activity")
    print_response(response)

    # GET team member activity with filters
    print_test(f"/team-reports/team/{CONFIG['existing_team_id']}/activity?user_id={CONFIG['existing_user_id']}&week_start={CONFIG['test_week_start']}", "GET")
    response = requests.get(
        f"{BASE_URL}/team-reports/team/{CONFIG['existing_team_id']}/activity",
        params={
            "user_id": CONFIG["existing_user_id"],
            "week_start": CONFIG["test_week_start"]
        }
    )
    print_response(response)

# ============================================================================
# 4. INTEGRATIONS ENDPOINTS
# ============================================================================

def test_integrations_endpoints():
    print_section("4. INTEGRATIONS ENDPOINTS")

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

    # PUT update integration
    print_test(f"/integrations/{CONFIG['existing_tool_id']}/update", "PUT")
    update_data = {
        "user_id": CONFIG["existing_user_id"],
        "access_token": "updated_token_xyz",
        "config": {"auto_sync": False}
    }
    response = requests.put(f"{BASE_URL}/integrations/{CONFIG['existing_tool_id']}/update", json=update_data)
    print_response(response)

    # DELETE disconnect integration
    # Uncomment if you want to test disconnect
    # print_test(f"/integrations/{CONFIG['existing_tool_id']}/disconnect", "DELETE")
    # response = requests.delete(
    #     f"{BASE_URL}/integrations/{CONFIG['existing_tool_id']}/disconnect",
    #     params={"user_id": CONFIG["existing_user_id"]}
    # )
    # print_response(response)

# ============================================================================
# 5. CALENDAR ENDPOINTS
# ============================================================================

def test_calendar_endpoints():
    print_section("5. CALENDAR ENDPOINTS")

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
        "status": "in_progress",
        "metadata": {"notes": "Updated via API test"}
    }
    response = requests.put(f"{BASE_URL}/calendar/{CONFIG['existing_activity_log_id']}", json=update_data)
    print_response(response)

    # POST publish single calendar entry
    print_test(f"/calendar/{CONFIG['existing_activity_log_id']}/publish", "POST")
    response = requests.post(f"{BASE_URL}/calendar/{CONFIG['existing_activity_log_id']}/publish")
    print_response(response)

    # POST publish entire week
    print_test(f"/calendar/user/{CONFIG['existing_user_id']}/week/{CONFIG['test_week_start']}/publish", "POST")
    response = requests.post(f"{BASE_URL}/calendar/user/{CONFIG['existing_user_id']}/week/{CONFIG['test_week_start']}/publish")
    print_response(response)

    # DELETE calendar entry
    # Uncomment if you want to test delete
    # print_test(f"/calendar/{CONFIG['existing_activity_log_id']}", "DELETE")
    # response = requests.delete(f"{BASE_URL}/calendar/{CONFIG['existing_activity_log_id']}")
    # print_response(response)

# ============================================================================
# MAIN EXECUTION
# ============================================================================
OUTPUT_FILE = "api_test_results.md"

def write_md(text):
    """Append text to the markdown output file"""
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(text + "\n")

def print_section(title):
    """Write a formatted section header to MD"""
    write_md("\n" + "="*80)
    write_md(f"## {title}")
    write_md("="*80 + "\n")

def print_test(endpoint, method):
    """Write test info to MD"""
    write_md(f"\n### [{method}] {endpoint}\n")
    write_md("-" * 80)

def print_response(response):
    """Write formatted response to MD"""
    write_md(f"**Status:** {response.status_code}")
    try:
        json_text = json.dumps(response.json(), indent=2)
        write_md(f"```json\n{json_text}\n```")
    except:
        write_md(f"```text\n{response.text}\n```")
    write_md("\n")

def main():
    # Clear the file first
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(f"# FocusFlow API Test Results\n\nBase URL: {BASE_URL}\n\n")

    try:
        # Run all tests
        test_users_endpoints()
        test_team_members_endpoints()
        test_team_reports_endpoints()
        test_integrations_endpoints()
        test_calendar_endpoints()

        print_section("TEST SUITE COMPLETED")
        print("Test Completed :D")
        write_md("✓ All endpoint tests executed\n")
        write_md("Note: Some tests are commented out (DELETE operations).")
    except requests.exceptions.ConnectionError:
        write_md(f"❌ ERROR: Could not connect to API server at {BASE_URL}")
    except Exception as e:
        write_md(f"❌ ERROR: {str(e)}")

if __name__ == "__main__":
    main()
