import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

DATABASE_URL = settings.DATABASE_URL or "sqlite:///./traceback.db"

# Normalizing postgres URI for sqlalchemy/psycopg
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )
    # Test connection
    with engine.connect() as conn:
        if not is_sqlite:
            # Enable pgvector if postgresql
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
            except Exception as e:
                print(f"[Warning] Could not initialize pgvector extension: {e}")
except Exception as e:
    print(f"[Database Error] Failed to connect to {DATABASE_URL}: {e}. Falling back to SQLite.")
    DATABASE_URL = "sqlite:///./traceback.db"
    is_sqlite = True
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
