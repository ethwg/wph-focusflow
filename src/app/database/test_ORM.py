from sqlalchemy.orm import Session
from sqlalchemy import text
from src.app.database.db import SessionLocal
from src.app.database.models import (
    Organization,
    Role,
    Team,
    UserAccount,
    Tool,
    ActionTemplate,
    ActivityLog,
    DailySummary,
    MeetingSummary,
    Notification,
    WeeklyReport,
    TeamReport
)

def test_queries():
    db: Session = SessionLocal()
    try:
        # Simple check
        result = db.execute(text("SELECT 1"))
        print("✅ DB connected:", result.scalar())

        tables = [
            Organization,
            Role,
            Team,
            UserAccount,
            Tool,
            ActionTemplate,
            ActivityLog,
            DailySummary,
            MeetingSummary,
            Notification,
            WeeklyReport,
            TeamReport
        ]

        for table in tables:
            print(f"\n📦 Fetching from {table.__tablename__}...")
            try:
                rows = db.query(table).limit(5).all()
                if rows:
                    for row in rows:
                        print("-", row)
                else:
                    print("No rows found.")
            except Exception as e:
                print(f"❌ Failed to query {table.__tablename__}: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    test_queries()
