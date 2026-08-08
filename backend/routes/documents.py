from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user
import models, schemas
import uuid, os

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.DocumentResponse)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    s3_key = f"{current_user.id}/{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, s3_key.replace("/", "_"))

    contents = file.file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    doc = models.Document(
        filename=file.filename,
        s3_key=s3_key,
        file_size=len(contents),
        owner_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/", response_model=List[schemas.DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Document).filter(models.Document.owner_id == current_user.id).all()

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
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
