from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.gallery import Gallery
from app.schemas.gallery import GalleryCreate, GalleryOut, GalleryUpdate

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parents[4] / "uploads"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXTS = {".mp4", ".webm", ".mov", ".mkv"}
MAX_UPLOAD_BYTES = settings.MEDIA_MAX_SIZE_MB * 1024 * 1024


def _infer_media_type(content_type: str, suffix: str) -> str | None:
    if content_type.startswith("image/") or suffix in IMAGE_EXTS:
        return "photo"
    if content_type.startswith("video/") or suffix in VIDEO_EXTS:
        return "video"
    return None


def _parse_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return True
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _save_upload_file(file: UploadFile, file_path: Path) -> None:
    size = 0
    with file_path.open("wb") as buffer:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                buffer.close()
                if file_path.exists():
                    file_path.unlink()
                raise HTTPException(status_code=400, detail="File too large")
            buffer.write(chunk)


@router.get("/", response_model=list[GalleryOut])
def list_gallery(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Gallery)
    if active_only:
        query = query.filter(Gallery.is_active.is_(True))
    return query.order_by(Gallery.id.desc()).all()


@router.post("/", response_model=GalleryOut, dependencies=[Depends(get_current_user)])
def create_gallery_item(payload: GalleryCreate, db: Session = Depends(get_db)):
    item = Gallery(**payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/upload", response_model=GalleryOut, dependencies=[Depends(get_current_user)])
def upload_gallery_item(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    media_type: str | None = Form(None),
    is_active: str | bool | None = Form(True),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File is required")

    suffix = Path(file.filename).suffix.lower()
    inferred_type = _infer_media_type(file.content_type or "", suffix)
    if not inferred_type:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if not suffix:
        suffix = ".jpg" if inferred_type == "photo" else ".mp4"

    requested_type = (media_type or "").strip().lower()
    if requested_type in {"", "auto"}:
        requested_type = inferred_type
    if requested_type not in {"photo", "video"}:
        raise HTTPException(status_code=400, detail="Invalid media type")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / filename
    _save_upload_file(file, file_path)

    item = Gallery(
        media_type=requested_type,
        title=title,
        url=f"/uploads/{filename}",
        is_active=_parse_bool(is_active),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=GalleryOut, dependencies=[Depends(get_current_user)])
def update_gallery_item(item_id: int, payload: GalleryUpdate, db: Session = Depends(get_db)):
    item = db.query(Gallery).filter(Gallery.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", dependencies=[Depends(get_current_user)])
def delete_gallery_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Gallery).filter(Gallery.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    if item.url and item.url.startswith("/uploads/"):
        file_path = UPLOAD_DIR / Path(item.url).name
        if file_path.exists():
            file_path.unlink()

    db.delete(item)
    db.commit()
    return {"status": "deleted"}
