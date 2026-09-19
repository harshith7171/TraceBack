import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base
from app.routers import memories, search, graph, activity, auth
from app.routers.auth import seed_demo_user_and_notifications
from app.seed import seed_database
from app.database import SessionLocal

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed database with demo items if empty
try:
    seed_database()
    with SessionLocal() as db:
        seed_demo_user_and_notifications(db)
except Exception as e:
    print(f"[Startup Warning] Seed check: {e}")

app = FastAPI(
    title="TraceBack API",
    description="The Digital Memory Engine - Semantic Search, OCR & Document Retrieval API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files statically
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(memories.router)
app.include_router(search.router)
app.include_router(graph.router)
app.include_router(activity.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TraceBack Engine",
        "version": "1.0.0"
    }

@app.post("/api/seed")
def trigger_seed():
    seed_database()
    return {"status": "success", "message": "Demo memories and activity logs seeded successfully."}
