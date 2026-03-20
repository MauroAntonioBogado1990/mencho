# app/api/dependencies.py
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal # Verifica que SessionLocal sea el nombre correcto en database.py

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()