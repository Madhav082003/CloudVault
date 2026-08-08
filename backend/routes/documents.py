from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date
from database import get_db
from auth import get_current_user
from s3 import upload_file_to_s3, generate_presigned_url, delete_file_from_s3
import models, schemas
import uuid

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

ALLOWED_TYPES = {
    "pdf":  "pdf",
    "doc":  "word",  "docx": "word",
    "xls":  "excel", "xlsx": "excel",
    "png":  "image", "jpg":  "image", "jpeg": "image", "gif": "image", "webp": "image",
    "txt":  "text",  "md":   "text",  "csv":  "text",
    "zip":  "archive", "rar": "archive", "7z": "archive",
    "mp4":  "video", "mov": "video", "avi": "video",
    "ppt":  "powerpoint", "pptx": "powerpoint",
}

CONTENT_TYPES = {
    "pdf": "application/pdf",
    "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "gif": "image/gif", "webp": "image/webp",
    "txt": "text/plain", "md": "text/markdown", "csv": "text/csv",
    "mp4": "video/mp4", "mov": "video/quicktime",
}

def get_file_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ALLOWED_TYPES.get(ext, "unknown")

def get_content_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return CONTENT_TYPES.get(ext, "application/octet-stream")


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
    content_type = get_content_type(file.filename)
    s3_key = f"users/{current_user.id}/{uuid.uuid4()}_{file.filename}"

    upload_file_to_s3(contents, s3_key, content_type)

    doc = models.Document(
        filename=file.filename,
        s3_key=s3_key,
        file_size=len(contents),
        file_type=file_type,
        owner_id=current_user.id,
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
        recent_uploads=recent,
    )


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    docs = db.query(models.Document).filter(models.Document.owner_id == current_user.id).all()

    type_counts = {}
    type_sizes = {}
    for doc in docs:
        ft = doc.file_type or "unknown"
        type_counts[ft] = type_counts.get(ft, 0) + 1
        type_sizes[ft] = type_sizes.get(ft, 0) + (doc.file_size or 0)

    today = date.today()
    daily = {}
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        daily[day.strftime("%a")] = 0
    for doc in docs:
        delta = (today - doc.uploaded_at.date()).days
        if 0 <= delta <= 6:
            day_str = doc.uploaded_at.strftime("%a")
            daily[day_str] = daily.get(day_str, 0) + 1

    return {
        "type_counts": type_counts,
        "type_sizes": type_sizes,
        "daily_uploads": daily,
    }


@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from fastapi.responses import StreamingResponse
    from s3 import s3_client
    from config import S3_BUCKET_NAME

    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    obj = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=doc.s3_key)

    def iter_content():
        yield from obj["Body"].iter_chunks(chunk_size=8192)

    return StreamingResponse(
        iter_content(),
        media_type=obj.get("ContentType", "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'}
    )


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

    delete_file_from_s3(doc.s3_key)
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
