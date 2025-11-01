"""
Database session management for FastAPI dependency injection.
Imports the database engine and session from db.py
"""

from .db import SessionLocal

def get_db():
    """
    Dependency function that yields a database session.
    Used with FastAPI's Depends() for automatic session management.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()