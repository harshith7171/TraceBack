import json
from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models import Memory, ActivityLog
from app.services.embedding import get_embedding

# Base64 SVG previews for mock screenshot and notes
INTERNSHIP_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='220' viewBox='0 0 400 220'><rect width='400' height='220' fill='%231e293b'/><rect x='10' y='10' width='380' height='30' rx='6' fill='%23334155'/><circle cx='30' cy='25' r='5' fill='%23ef4444'/><circle cx='46' cy='25' r='5' fill='%23f59e0b'/><circle cx='62' cy='25' r='5' fill='%2310b981'/><rect x='80' y='16' width='200' height='18' rx='4' fill='%231e293b'/><text x='90' y='29' font-family='sans-serif' font-size='10' fill='%2394a3b8'>careers.techcorp.io/portal</text><rect x='10' y='50' width='380' height='160' rx='6' fill='%230f172a'/><text x='30' y='85' font-family='sans-serif' font-weight='bold' font-size='16' fill='%23f8fafc'>Internship Application Portal</text><text x='30' y='110' font-family='sans-serif' font-size='12' fill='%2338bdf8'>Role: Software Engineer Intern (Summer 2027)</text><rect x='30' y='130' width='340' height='50' rx='6' fill='%231e293b'/><text x='42' y='150' font-family='sans-serif' font-size='11' fill='%23cbd5e1'>Deadline: October 15, 2026 (Priority Review)</text><text x='42' y='168' font-family='sans-serif' font-size='10' fill='%23ef4444'>Status: Applications closing soon</text></svg>"

DAA_NOTES_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='220' viewBox='0 0 400 220'><rect width='400' height='220' fill='%23fdfbf7'/><line x1='0' y1='30' x2='400' y2='30' stroke='%23e2e8f0' stroke-width='1.5'/><line x1='0' y1='60' x2='400' y2='60' stroke='%23e2e8f0' stroke-width='1.5'/><line x1='0' y1='90' x2='400' y2='90' stroke='%23e2e8f0' stroke-width='1.5'/><line x1='0' y1='120' x2='400' y2='120' stroke='%23e2e8f0' stroke-width='1.5'/><line x1='0' y1='150' x2='400' y2='120' stroke='%23e2e8f0' stroke-width='1.5'/><line x1='0' y1='180' x2='400' y2='180' stroke='%23e2e8f0' stroke-width='1.5'/><line x1='50' y1='0' x2='50' y2='220' stroke='%23fca5a5' stroke-width='1'/><text x='65' y='52' font-family='cursive, serif' font-size='16' fill='%231e3a8a'>DAA - Dynamic Programming</text><text x='65' y='82' font-family='cursive, serif' font-size='13' fill='%231e293b'>- Bellman Ford: O(V * E) shortest path</text><text x='65' y='112' font-family='cursive, serif' font-size='13' fill='%231e293b'>- Floyd Warshall: All pairs shortest path O(V^3)</text><text x='65' y='142' font-family='cursive, serif' font-size='13' fill='%231e293b'>- Memoization vs Tabulation (overlapping subproblems)</text><text x='65' y='172' font-family='cursive, serif' font-size='13' fill='%231e293b'>- Recurrence relation: T(n) = T(n-1) + T(n-2)</text></svg>"

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing if needed
    if db.query(Memory).count() > 0:
        db.close()
        return

    now = datetime.utcnow()

    sample_memories = [
        {
            "id": "mem-1",
            "title": "Internship Portal",
            "memory_type": "screenshot",
            "content_snippet": "Screenshot of internship deadline from company website...",
            "extracted_text": "Internship Application Portal - Summer 2027 Engineering Internship. Important Deadlines: Early consideration closes October 15, 2026. Standard application deadline: November 30. Requirements: Resume, Cover Letter, Unofficial Transcript, and GitHub Portfolio. Technical assessment link sent within 48 hours of submission. Contact: internship-admissions@techcorp.io",
            "preview_image_url": INTERNSHIP_SVG,
            "created_at": now - timedelta(days=7),
            "is_favorite": True,
            "tags": "internship, deadline, portal, career"
        },
        {
            "id": "mem-2",
            "title": "ML Notes.pdf",
            "memory_type": "pdf",
            "content_snippet": "Notes on machine learning algorithms and applications.",
            "extracted_text": "Machine Learning Foundations and Advanced Architectures. Supervised vs Unsupervised Learning. Deep neural networks, transformers, attention mechanisms, loss functions, gradient descent optimization, and evaluation metrics (ROC-AUC, Precision, Recall). Practical applications in computer vision, OCR, and natural language processing.",
            "preview_image_url": None,
            "created_at": now - timedelta(days=9),
            "is_favorite": True,
            "tags": "machine learning, pdf, ai, algorithms"
        },
        {
            "id": "mem-3",
            "title": "OpenAI Blog",
            "memory_type": "link",
            "content_snippet": "Interesting article about multimodal AI systems.",
            "extracted_text": "Exploring Frontier Multimodal Intelligence. Research paper breakdown on cross-attention between vision and language models. Demonstrates unified text-image comprehension, zero-shot OCR retrieval, and visual reasoning in complex real-world documents.",
            "source_url": "https://openai.com/blog",
            "preview_image_url": None,
            "created_at": now - timedelta(days=11),
            "is_favorite": False,
            "tags": "ai, multimodal, llm, blog"
        },
        {
            "id": "mem-4",
            "title": "DAA Notes",
            "memory_type": "image",
            "content_snippet": "Notes on dynamic programming and graph algorithms.",
            "extracted_text": "Design and Analysis of Algorithms (DAA). Dynamic Programming: Optimal substructure and overlapping subproblems. Memoization vs Tabulation. Bellman-Ford, Dijkstra's shortest path, Floyd-Warshall, and minimum spanning trees (Prim's & Kruskal's). Time complexity O(V+E) and asymptotic notation analysis.",
            "preview_image_url": DAA_NOTES_SVG,
            "created_at": now - timedelta(days=14),
            "is_favorite": False,
            "tags": "algorithms, daa, dynamic programming, college"
        },
        {
            "id": "mem-5",
            "title": "Ideas for final year project",
            "memory_type": "note",
            "content_snippet": "Digital memory search engine with multimodal OCR and pgvector...",
            "extracted_text": "Final Year Capstone Project Concept: Build a local-first personal knowledge discovery engine called TraceBack. Features: auto screenshot capture, OCR on handwritten notes, PDF text indexing, web bookmarking, and instant natural language retrieval using embeddings and pgvector.",
            "preview_image_url": None,
            "created_at": now - timedelta(days=1),
            "is_favorite": True,
            "tags": "project, notes, final year, ideas"
        },
        {
            "id": "mem-6",
            "title": "ML_Handbook.pdf",
            "memory_type": "pdf",
            "content_snippet": "Handbook covering end-to-end vector search and retrieval systems.",
            "extracted_text": "Machine Learning Engineering Handbook: Production ML systems, model registry, vector databases, vector search indexing (HNSW, IVFFlat), latency benchmarking, and embeddings at scale.",
            "preview_image_url": None,
            "created_at": now - timedelta(days=2),
            "is_favorite": False,
            "tags": "ml, handbook, vector database"
        }
    ]

    for item in sample_memories:
        embed_text = f"{item['title']} {item['memory_type']} {item['content_snippet']} {item['extracted_text']}"
        vector = get_embedding(embed_text)
        mem = Memory(
            id=item["id"],
            title=item["title"],
            memory_type=item["memory_type"],
            content_snippet=item["content_snippet"],
            extracted_text=item["extracted_text"],
            source_url=item.get("source_url"),
            preview_image_url=item.get("preview_image_url"),
            embedding_json=json.dumps(vector),
            created_at=item["created_at"],
            is_favorite=item.get("is_favorite", False),
            tags=item.get("tags")
        )
        db.add(mem)

    # Add Activity logs matching the screenshot exactly
    sample_activities = [
        {
            "action_type": "upload",
            "title": "Uploaded screenshot",
            "target": "internship_portal.png",
            "created_at": now - timedelta(hours=2)
        },
        {
            "action_type": "save_link",
            "title": "Saved link",
            "target": "openai.com/blog",
            "created_at": now - timedelta(hours=5)
        },
        {
            "action_type": "note",
            "title": "Added note",
            "target": "Ideas for final year project",
            "created_at": now - timedelta(days=1)
        },
        {
            "action_type": "search",
            "title": "Searched",
            "target": '"machine learning notes"',
            "created_at": now - timedelta(days=1)
        },
        {
            "action_type": "upload",
            "title": "Uploaded PDF",
            "target": "ML_Handbook.pdf",
            "created_at": now - timedelta(days=2)
        }
    ]

    for act in sample_activities:
        db.add(ActivityLog(
            action_type=act["action_type"],
            title=act["title"],
            target=act["target"],
            created_at=act["created_at"]
        ))

    db.commit()
    db.close()
    print("[Seed] Successfully seeded initial demo memories and activities.")

if __name__ == "__main__":
    seed_database()
