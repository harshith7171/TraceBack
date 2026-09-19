from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import KnowledgeGraphResponse
from app.services.graph import build_knowledge_graph

router = APIRouter(prefix="/api/knowledge-graph", tags=["graph"])

@router.get("", response_model=KnowledgeGraphResponse)
def get_graph(db: Session = Depends(get_db)):
    return build_knowledge_graph(db)
