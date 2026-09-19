from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ActivityLog
from app.schemas import ActivityLogResponse

router = APIRouter(prefix="/api/activity", tags=["activity"])

def format_time_ago(dt: datetime) -> str:
    now = datetime.utcnow()
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        mins = max(1, seconds // 60)
        return f"{mins} min{'s' if mins > 1 else ''} ago"
    elif seconds < 86400:
        hrs = max(1, seconds // 3600)
        return f"{hrs} hour{'s' if hrs > 1 else ''} ago"
    elif seconds < 604800:
        days = max(1, seconds // 86400)
        return f"{days} day{'s' if days > 1 else ''} ago"
    else:
        weeks = max(1, seconds // 604800)
        return f"{weeks} week{'s' if weeks > 1 else ''} ago"

@router.get("", response_model=List[ActivityLogResponse])
def get_recent_activities(limit: int = 10, db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    results = []
    for log in logs:
        item = ActivityLogResponse.model_validate(log)
        item.time_ago = format_time_ago(log.created_at)
        results.append(item)
    return results
