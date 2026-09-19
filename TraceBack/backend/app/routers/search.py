from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ActivityLog
from app.schemas import SearchRequest, SearchResponse
from app.services.search import search_memories

router = APIRouter(prefix="/api/search", tags=["search"])

@router.post("", response_model=SearchResponse)
def perform_search(
    req: SearchRequest,
    db: Session = Depends(get_db)
):
    clean_query = req.query.strip()
    if not clean_query:
        return SearchResponse(query="", total=0, results=[])

    results = search_memories(
        db=db,
        query=clean_query,
        top_k=req.top_k,
        filter_type=req.filter_type
    )

    # Log search activity
    try:
        activity = ActivityLog(
            action_type="search",
            title="Searched",
            target=f'"{clean_query[:50]}"'
        )
        db.add(activity)
        db.commit()
    except Exception:
        pass

    return SearchResponse(
        query=clean_query,
        total=len(results),
        results=results
    )
