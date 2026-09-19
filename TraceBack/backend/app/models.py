import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False, default="Harshith")
    created_at = Column(DateTime, default=datetime.utcnow)

class Memory(Base):
    __tablename__ = "memories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True, default="demo-user")
    title = Column(String(255), nullable=False)
    memory_type = Column(String(50), nullable=False)  # "screenshot", "pdf", "link", "image", "note", "pptx"
    content_snippet = Column(Text, nullable=True)
    extracted_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    source_url = Column(String(1024), nullable=True)
    file_path = Column(String(1024), nullable=True)
    preview_image_url = Column(String(1024), nullable=True)
    embedding_json = Column(Text, nullable=True)  # JSON-encoded vector
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    tags = Column(String(512), nullable=True)

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True, default="demo-user")
    action_type = Column(String(50), nullable=False)  # "upload", "save_link", "note", "search"
    title = Column(String(255), nullable=False)        # e.g. "Uploaded screenshot", "Saved link"
    target = Column(String(255), nullable=False)       # e.g. "internship_portal.png", "openai.com/blog"
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True, default="demo-user")
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="system")  # "indexing", "system", "insight"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
