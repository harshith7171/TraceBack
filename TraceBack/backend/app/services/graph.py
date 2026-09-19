import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Memory
from app.schemas import KnowledgeNode, KnowledgeEdge, KnowledgeGraphResponse
from app.services.embedding import cosine_similarity

def build_knowledge_graph(db: Session) -> KnowledgeGraphResponse:
    """
    Constructs a dynamic knowledge map graph based on memories
    and their semantic connections.
    """
    memories = db.query(Memory).all()
    
    # Default fallback nodes if few memories exist
    if len(memories) < 2:
        default_nodes = [
            KnowledgeNode(id="internship-hub", label="Internship", memory_type="hub", cluster="career", val=22),
            KnowledgeNode(id="resume", label="Resume", memory_type="pdf", cluster="career", val=14),
            KnowledgeNode(id="cover-letter", label="Cover Letter", memory_type="note", cluster="career", val=14),
            KnowledgeNode(id="companies", label="Companies", memory_type="link", cluster="career", val=14),
            KnowledgeNode(id="deadlines", label="Deadlines", memory_type="screenshot", cluster="career", val=16),
            KnowledgeNode(id="preparation", label="Preparation", memory_type="note", cluster="career", val=14),
            KnowledgeNode(id="interview-tips", label="Interview Tips", memory_type="note", cluster="career", val=14),
        ]
        default_edges = [
            KnowledgeEdge(source="internship-hub", target="resume", value=0.85),
            KnowledgeEdge(source="internship-hub", target="cover-letter", value=0.82),
            KnowledgeEdge(source="internship-hub", target="companies", value=0.78),
            KnowledgeEdge(source="internship-hub", target="deadlines", value=0.92),
            KnowledgeEdge(source="internship-hub", target="preparation", value=0.80),
            KnowledgeEdge(source="internship-hub", target="interview-tips", value=0.76),
        ]
        return KnowledgeGraphResponse(nodes=default_nodes, edges=default_edges)
        
    nodes = []
    edges = []
    
    # Create memory nodes
    for mem in memories:
        label = mem.title
        if len(label) > 18:
            label = label[:16] + "..."
        nodes.append(
            KnowledgeNode(
                id=mem.id,
                label=label,
                memory_type=mem.memory_type,
                cluster=mem.memory_type,
                val=16 if mem.is_favorite else 12
            )
        )
        
    # Calculate pairwise similarities for edges
    for i in range(len(memories)):
        vec_i = None
        if memories[i].embedding_json:
            try:
                vec_i = json.loads(memories[i].embedding_json)
            except Exception:
                pass
        if not vec_i:
            continue
            
        for j in range(i + 1, len(memories)):
            vec_j = None
            if memories[j].embedding_json:
                try:
                    vec_j = json.loads(memories[j].embedding_json)
                except Exception:
                    pass
            if not vec_j:
                continue
                
            sim = cosine_similarity(vec_i, vec_j)
            # Add edge if similarity is above threshold
            if sim >= 0.25:
                edges.append(
                    KnowledgeEdge(
                        source=memories[i].id,
                        target=memories[j].id,
                        value=round(sim, 2)
                    )
                )

    # Ensure connected graph: if no edges, connect sequential items
    if not edges and len(nodes) > 1:
        for i in range(len(nodes) - 1):
            edges.append(KnowledgeEdge(source=nodes[i].id, target=nodes[i+1].id, value=0.5))

    return KnowledgeGraphResponse(nodes=nodes, edges=edges)
