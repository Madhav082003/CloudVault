from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from auth import get_current_user
import models, schemas
import uuid, os

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

ALLOWED_TYPES = {
    "pdf": "pdf",
    "doc": "word", "docx": "word",
    "xls": "excel", "xlsx": "excel",
    "png": "image", "jpg": "image", "jpeg": "image", "gif": "image", "webp": "image",
    "txt": "text", "md": "text", "csv": "text",
    "zip": "archive", "rar": "archive", "7z": "archive",
    "mp4": "video", "mov": "video", "avi": "video",
    "ppt": "powerpoint", "pptx": "powerpoint",
}

def get_file_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ALLOWED_TYPES.get(ext, "unknown")


@router.post("/upload", response_model=schemas.DocumentResponse)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    contents = file.file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    file_type = get_file_type(file.filename)

    s3_key = f"{current_user.id}/{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, s3_key.replace("/", "_"))

    with open(file_path, "wb") as f:
        f.write(contents)

    doc = models.Document(
        filename=file.filename,
        s3_key=s3_key,
        file_size=len(contents),
        file_type=file_type,
        owner_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/", response_model=List[schemas.DocumentResponse])
def list_documents(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Document).filter(models.Document.owner_id == current_user.id)
    if search:
        query = query.filter(models.Document.filename.ilike(f"%{search}%"))
    return query.order_by(models.Document.uploaded_at.desc()).all()


@router.get("/stats", response_model=schemas.StorageStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    docs = db.query(models.Document).filter(models.Document.owner_id == current_user.id).all()
    total_size = sum(d.file_size or 0 for d in docs)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent = sum(1 for d in docs if d.uploaded_at >= week_ago)
    return schemas.StorageStats(
        total_documents=len(docs),
        total_size_bytes=total_size,
        recent_uploads=recent
    )


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    docs = db.query(models.Document).filter(models.Document.owner_id == current_user.id).all()

    # File type breakdown
    type_counts = {}
    type_sizes = {}
    for doc in docs:
        ft = doc.file_type or "unknown"
        type_counts[ft] = type_counts.get(ft, 0) + 1
        type_sizes[ft] = type_sizes.get(ft, 0) + (doc.file_size or 0)

    # Daily uploads — last 7 days
    from datetime import date, timedelta
    today = date.today()
    daily = {}
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        daily[day.strftime("%a")] = 0
    for doc in docs:
        day_str = doc.uploaded_at.strftime("%a")
        delta = (today - doc.uploaded_at.date()).days
        if 0 <= delta <= 6:
            daily[day_str] = daily.get(day_str, 0) + 1

    return {
        "type_counts": type_counts,
        "type_sizes": type_sizes,
        "daily_uploads": daily,
    }


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = os.path.join(UPLOAD_DIR, doc.s3_key.replace("/", "_"))
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
