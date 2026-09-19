import json
import re
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Memory
from app.schemas import SearchResultItem, MemoryResponse
from app.services.embedding import get_embedding, cosine_similarity

def highlight_context(full_text: str, query: str, max_chars: int = 240) -> str:
    """
    Finds the most relevant section of text matching query terms.
    """
    if not full_text:
        return ""
    
    terms = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9]{3,}\b', query) if len(w) > 2]
    sentences = re.split(r'(?<=[.!?\n])\s+', full_text)
    
    best_sentence = ""
    best_count = -1
    
    for s in sentences:
        s_lower = s.lower()
        count = sum(1 for t in terms if t in s_lower)
        if count > best_count:
            best_count = count
            best_sentence = s.strip()
            
    if best_sentence and best_count > 0:
        if len(best_sentence) > max_chars:
            return best_sentence[:max_chars] + "..."
        return best_sentence
    
    # Fallback to first section
    return full_text[:max_chars].replace("\n", " ") + ("..." if len(full_text) > max_chars else "")

def generate_why_matched(title: str, query: str, memory_type: str, score: float, matched_text: str) -> str:
    """
    Produces a natural language explanation of why the item matched the search.
    """
    q_words = [w.lower() for w in re.findall(r'\b\w+\b', query)]
    matched_words = [w for w in q_words if w in matched_text.lower() or w in title.lower()]
    
    pct = int(round(score * 100))
    if matched_words:
        keywords = ", ".join(f"'{w}'" for w in matched_words[:3])
        return f"Direct concept match ({pct}% similarity) containing {keywords} in {memory_type} content."
    elif score >= 0.7:
        return f"Strong semantic association ({pct}% similarity) with concepts in '{query}'."
    elif score >= 0.4:
        return f"Moderate contextual overlap ({pct}% similarity) with '{query}'."
    else:
        return f"Partial topical match ({pct}% similarity)."

def search_memories(
    db: Session,
    query: str,
    top_k: int = 10,
    filter_type: Optional[str] = None
) -> List[SearchResultItem]:
    """
    Performs semantic vector search across all memories.
    """
    query_vec = get_embedding(query)
    
    query_builder = db.query(Memory)
    if filter_type and filter_type.lower() != "all":
        if filter_type.lower() == "favorites":
            query_builder = query_builder.filter(Memory.is_favorite == True)
        elif filter_type.lower() == "documents":
            query_builder = query_builder.filter(Memory.memory_type.in_(["pdf", "note"]))
        else:
            # e.g. "pdf", "image", "screenshot", "link", "note"
            query_builder = query_builder.filter(Memory.memory_type == filter_type.lower())
            
    memories = query_builder.all()
    results = []
    
    for mem in memories:
        mem_vec = None
        if mem.embedding_json:
            try:
                mem_vec = json.loads(mem.embedding_json)
            except Exception:
                mem_vec = None
                
        if not mem_vec:
            # If embedding missing, compute and cache it
            content_to_embed = f"{mem.title} {mem.memory_type} {mem.content_snippet or ''} {mem.extracted_text or ''}"
            mem_vec = get_embedding(content_to_embed)
            mem.embedding_json = json.dumps(mem_vec)
            db.commit()
            
        sim = cosine_similarity(query_vec, mem_vec)
        
        # Boost if query words appear directly in title or snippet
        text_content = f"{mem.title} {mem.content_snippet or ''} {mem.extracted_text or ''}".lower()
        for term in query.lower().split():
            if len(term) > 2 and term in text_content:
                sim += 0.08
                
        # Clamp sim to max 0.99
        sim = min(0.99, max(0.05, sim))
        
        full_text = mem.extracted_text or mem.content_snippet or ""
        snippet = highlight_context(full_text, query)
        why_matched = generate_why_matched(mem.title, query, mem.memory_type, sim, snippet)
        
        results.append((sim, mem, snippet, why_matched))
        
    # Sort by similarity descending
    results.sort(key=lambda x: x[0], reverse=True)
    top_results = results[:top_k]
    
    output = []
    for sim, mem, snippet, why in top_results:
        output.append(
            SearchResultItem(
                memory=MemoryResponse.model_validate(mem),
                similarity_score=round(sim, 3),
                matched_snippet=snippet,
                why_matched=why
            )
        )
    return output

def get_related_memories(db: Session, target_memory_id: str, limit: int = 3) -> List[MemoryResponse]:
    """
    Finds memories semantically most related to a specific memory.
    """
    target = db.query(Memory).filter(Memory.id == target_memory_id).first()
    if not target or not target.embedding_json:
        return []
        
    try:
        target_vec = json.loads(target.embedding_json)
    except Exception:
        return []
        
    candidates = db.query(Memory).filter(Memory.id != target_memory_id).all()
    scored = []
    for c in candidates:
        if c.embedding_json:
            try:
                c_vec = json.loads(c.embedding_json)
                sim = cosine_similarity(target_vec, c_vec)
                scored.append((sim, c))
            except Exception:
                continue
                
    scored.sort(key=lambda x: x[0], reverse=True)
    return [MemoryResponse.model_validate(mem) for _, mem in scored[:limit]]
