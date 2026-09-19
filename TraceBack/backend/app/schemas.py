from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class MemoryBase(BaseModel):
    title: str
    memory_type: str
    content_snippet: Optional[str] = None
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    source_url: Optional[str] = None
    file_path: Optional[str] = None
    preview_image_url: Optional[str] = None
    is_favorite: bool = False
    tags: Optional[str] = None

class NoteCreate(BaseModel):
    title: str
    content: str
    tags: Optional[str] = None

class LinkCreate(BaseModel):
    url: str
    custom_title: Optional[str] = None

class MemoryResponse(MemoryBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    filter_type: Optional[str] = None

class SearchResultItem(BaseModel):
    memory: MemoryResponse
    similarity_score: float
    matched_snippet: str
    why_matched: str

class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultItem]

class KnowledgeNode(BaseModel):
    id: str
    label: str
    memory_type: str
    cluster: str
    val: int = 10

class KnowledgeEdge(BaseModel):
    source: str
    target: str
    value: float

class KnowledgeGraphResponse(BaseModel):
    nodes: List[KnowledgeNode]
    edges: List[KnowledgeEdge]

class ActivityLogResponse(BaseModel):
    id: str
    action_type: str
    title: str
    target: str
    created_at: datetime
    time_ago: Optional[str] = None

    class Config:
        from_attributes = True
