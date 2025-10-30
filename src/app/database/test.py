import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_USER = os.getenv("DB_USER")  # e.g., "postgres.oxsireafylwqzujrgbec"
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")  # e.g., "aws-1-ap-southeast-1.pooler.supabase.com"
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")

# Construct PostgreSQL URL with SSL required for Supabase
DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
print("Database URL:", DB_URL)

# Create SQLAlchemy engine
engine = create_engine(DB_URL, echo=True)

# Create a session
Session = sessionmaker(bind=engine)
session = Session()

try:
    # Read query from public.organization table
    result = session.execute(text("SELECT * FROM public.organization LIMIT 5;"))
    
    # Fetch all rows
    rows = result.fetchall()
    
    for row in rows:
        print(row)
except Exception as e:
    print("Failed to execute query:", e)
finally:
    session.close()
