from sqlalchemy.orm import Session
from src.app.database.db import SessionLocal
from src.app.database.models import Organization

def test_db():
    db: Session = SessionLocal()
    try:
        # Fetch 5 organizations using ORM
        orgs = db.query(Organization).limit(5).all()
        print("✅ Fetched organizations:")
        for org in orgs:
            print(f"- {org.org_id}: {org.name} ({org.subdomain})")
    except Exception as e:
        print("❌ DB query failed:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
