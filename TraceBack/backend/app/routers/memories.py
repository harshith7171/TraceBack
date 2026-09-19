import os
import json
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Memory, ActivityLog, Notification
from app.schemas import MemoryResponse, NoteCreate, LinkCreate
from app.config import settings
from app.services.embedding import get_embedding
from app.services.extraction import extract_text_from_pdf, extract_text_from_image, scrape_webpage, extract_text_from_pptx
from app.services.search import get_related_memories
from app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/memories", tags=["memories"])

@router.get("", response_model=List[MemoryResponse])
def get_memories(
    type: Optional[str] = Query(None),
    favorite: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Memory)
    if favorite is True:
        query = query.filter(Memory.is_favorite == True)
    if type and type.lower() != "all":
        t = type.lower()
        if t == "documents":
            query = query.filter(Memory.memory_type.in_(["pdf", "note", "pptx"]))
        elif t == "images":
            query = query.filter(Memory.memory_type.in_(["image", "screenshot"]))
        elif t == "pdfs":
            query = query.filter(Memory.memory_type == "pdf")
        elif t in ["pptx", "presentations"]:
            query = query.filter(Memory.memory_type == "pptx")
        elif t == "notes":
            query = query.filter(Memory.memory_type == "note")
        elif t == "links":
            query = query.filter(Memory.memory_type == "link")
        else:
            query = query.filter(Memory.memory_type == t)

    return query.order_by(Memory.created_at.desc()).all()

@router.post("/upload", response_model=MemoryResponse)
async def upload_file(
    file: UploadFile = File(...),
    custom_title: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".pptx", ".ppt"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, PPTX, PPT, PNG, JPG, JPEG, WEBP."
        )

    file_id = str(uuid.uuid4())
    stored_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    title = custom_title if custom_title else file.filename
    preview_url = f"/api/uploads/{stored_filename}"

    # Extract text based on file type
    if ext in [".pptx", ".ppt"]:
        mem_type = "pptx"
        extracted_text, snippet = extract_text_from_pptx(file_path)
    elif ext == ".pdf":
        mem_type = "pdf"
        extracted_text, snippet = extract_text_from_pdf(file_path)
    else:
        # Image / screenshot
        mem_type = "screenshot" if "screenshot" in file.filename.lower() else "image"
        extracted_text, snippet = extract_text_from_image(file_path)

    # Embeddings
    content_to_embed = f"{title} {mem_type} {snippet} {extracted_text[:1000]}"
    vector = get_embedding(content_to_embed)

    memory = Memory(
        id=file_id,
        user_id=user_id,
        title=title,
        memory_type=mem_type,
        content_snippet=snippet,
        extracted_text=extracted_text,
        file_path=file_path,
        preview_image_url=preview_url if mem_type in ["image", "screenshot"] else None,
        embedding_json=json.dumps(vector),
        tags=tags
    )
    db.add(memory)

    # Activity log
    activity = ActivityLog(
        user_id=user_id,
        action_type="upload",
        title=f"Uploaded {mem_type.upper() if mem_type == 'pptx' else mem_type}",
        target=file.filename
    )
    db.add(activity)

    # Add notification
    notif = Notification(
        user_id=user_id,
        title=f"{'Presentation' if mem_type == 'pptx' else mem_type.capitalize()} Indexed",
        message=f"Deep OCR & text extraction completed for '{title}'.",
        notification_type="indexing"
    )
    db.add(notif)

    db.commit()
    db.refresh(memory)
    return memory

@router.post("/note", response_model=MemoryResponse)
def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db)
):
    if not note.title.strip() or not note.content.strip():
        raise HTTPException(status_code=400, detail="Note title and content cannot be empty.")

    snippet = note.content[:240].replace("\n", " ") + ("..." if len(note.content) > 240 else "")
    vector = get_embedding(f"{note.title} note {snippet} {note.content}")

    memory = Memory(
        title=note.title,
        memory_type="note",
        content_snippet=snippet,
        extracted_text=note.content,
        embedding_json=json.dumps(vector),
        tags=note.tags
    )
    db.add(memory)

    activity = ActivityLog(
        action_type="note",
        title="Added note",
        target=note.title
    )
    db.add(activity)

    db.commit()
    db.refresh(memory)
    return memory

@router.post("/link", response_model=MemoryResponse)
def save_link(
    link_data: LinkCreate,
    db: Session = Depends(get_db)
):
    url = link_data.url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    title, extracted_text, snippet = scrape_webpage(url)
    if link_data.custom_title:
        title = link_data.custom_title

    vector = get_embedding(f"{title} link {snippet} {extracted_text[:1000]}")

    memory = Memory(
        title=title,
        memory_type="link",
        source_url=url,
        content_snippet=snippet,
        extracted_text=extracted_text,
        embedding_json=json.dumps(vector)
    )
    db.add(memory)

    # Friendly target for activity
    target_display = url.replace("https://", "").replace("http://", "")
    if "/" in target_display:
        target_display = target_display.split("/")[0] + "/" + target_display.split("/")[1]

    activity = ActivityLog(
        action_type="save_link",
        title="Saved link",
        target=target_display
    )
    db.add(activity)

    db.commit()
    db.refresh(memory)
    return memory

@router.get("/{memory_id}")
def get_memory_detail(
    memory_id: str,
    db: Session = Depends(get_db)
):
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found.")

    related = get_related_memories(db, memory_id, limit=3)

    return {
        "memory": MemoryResponse.model_validate(mem),
        "related": related
    }

@router.delete("/{memory_id}")
def delete_memory(
    memory_id: str,
    db: Session = Depends(get_db)
):
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found.")

    # Remove stored file if exists
    if mem.file_path and os.path.exists(mem.file_path):
        try:
            os.remove(mem.file_path)
        except Exception:
            pass

    db.delete(mem)
    db.commit()
    return {"status": "deleted", "id": memory_id}

@router.patch("/{memory_id}/favorite")
def toggle_favorite(
    memory_id: str,
    db: Session = Depends(get_db)
):
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found.")

    mem.is_favorite = not mem.is_favorite
    db.commit()
    db.refresh(mem)
    return {"id": memory_id, "is_favorite": mem.is_favorite}
