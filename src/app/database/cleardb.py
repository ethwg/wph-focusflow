from sqlalchemy import text
from db import SessionLocal

session = SessionLocal()

# List all tables you want to clear
tables = [
    "Notification", "Meeting_Summary", "Team_Report", "Weekly_Report",
    "Daily_Summary", "Activity_Log", "Action_Template", "Tool",
    "User_Account", "Team", "Role", "Organization"
]

# Delete all data
for table in tables:
    print(f"Clearing table: {table}")
    session.execute(text(f"DELETE FROM {table}"))

session.commit()
print("All tables cleared!")
