import os
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db, DATABASE_URL, is_sqlite
from app.models import User, Notification, Memory
from app.config import settings

SECRET_KEY = os.getenv("JWT_SECRET", "traceback-super-secret-jwt-key-2026")
ALGORITHM = "HS256"

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    initials: str
    created_at: datetime
    memories_count: int = 0
    storage_formatted: str = "0 MB"
    is_cloud_db: bool = False
    db_provider: str = "Local SQLite (pgvector ready)"

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        return "demo-user"
    try:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload.get("sub", "demo-user")
    except Exception:
        pass
    return "demo-user"

def format_user_response(user: User, db: Session) -> UserResponse:
    memories_count = db.query(Memory).filter(
        (Memory.user_id == user.id) | (Memory.user_id == "demo-user")
    ).count()

    # Calculate rough storage size
    storage_mb = round(max(0.5, memories_count * 2.3), 1)

    names = user.full_name.strip().split()
    initials = "".join([n[0].upper() for n in names[:2]]) if names else "HU"

    is_cloud = not is_sqlite
    db_prov = "Online PostgreSQL (Cloud pgvector)" if is_cloud else "Local SQLite (pgvector ready)"

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        initials=initials,
        created_at=user.created_at,
        memories_count=memories_count,
        storage_formatted=f"{storage_mb} MB / 5 GB",
        is_cloud_db=is_cloud,
        db_provider=db_prov
    )

def seed_demo_user_and_notifications(db: Session):
    demo = db.query(User).filter(User.id == "demo-user").first()
    if not demo:
        demo = User(
            id="demo-user",
            email="harshith@traceback.ai",
            hashed_password=hash_password("traceback123"),
            full_name="Harshith",
            created_at=datetime.utcnow() - timedelta(days=30)
        )
        db.add(demo)

    if db.query(Notification).count() == 0:
        sample_notifs = [
            Notification(
                user_id="demo-user",
                title="Deep OCR Indexing Complete",
                message="Extracted and indexed text from 'Internship Portal' screenshot and ML notes.",
                notification_type="indexing",
                is_read=False,
                created_at=datetime.utcnow() - timedelta(minutes=45)
            ),
            Notification(
                user_id="demo-user",
                title="Knowledge Map Updated",
                message="Discovered 6 connected concept nodes around 'Internship' and 'Dynamic Programming'.",
                notification_type="insight",
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=3)
            ),
            Notification(
                user_id="demo-user",
                title="PowerPoint & PDF Support Active",
                message="You can now upload .pptx presentations with slide-level OCR scanning.",
                notification_type="system",
                is_read=True,
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
        ]
        db.add_all(sample_notifs)
    db.commit()

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Add welcome notification
    db.add(Notification(
        user_id=new_user.id,
        title="Welcome to TraceBack!",
        message="Your digital memory engine is ready. Upload files, presentations, or save links.",
        notification_type="system",
        is_read=False
    ))
    db.commit()

    token = create_token(new_user.id, new_user.email)
    return AuthResponse(token=token, user=format_user_response(new_user, db))

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Check for demo user shortcut or registered user
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        if req.email.lower() == "harshith@traceback.ai":
            seed_demo_user_and_notifications(db)
            user = db.query(User).filter(User.id == "demo-user").first()
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token(user.id, user.email)
    return AuthResponse(token=token, user=format_user_response(user, db))

@router.get("/me", response_model=UserResponse)
def get_me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    seed_demo_user_and_notifications(db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter(User.id == "demo-user").first()
    return format_user_response(user, db)

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    seed_demo_user_and_notifications(db)
    notifs = db.query(Notification).filter(
        (Notification.user_id == user_id) | (Notification.user_id == "demo-user")
    ).order_by(Notification.created_at.desc()).limit(15).all()
    return notifs

@router.patch("/notifications/read-all")
def mark_all_notifications_read(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        (Notification.user_id == user_id) | (Notification.user_id == "demo-user")
    ).update({"is_read": True})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
