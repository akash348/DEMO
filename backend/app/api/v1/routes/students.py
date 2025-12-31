from datetime import date, datetime
from pathlib import Path
from random import randint
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentOut, StudentUpdate

router = APIRouter(dependencies=[Depends(get_current_user)])

UPLOAD_DIR = Path(__file__).resolve().parents[4] / "uploads" / "students"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_BYTES = settings.MEDIA_MAX_SIZE_MB * 1024 * 1024


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


def _save_student_photo(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Photo is required")
    suffix = Path(file.filename).suffix.lower()
    if suffix not in IMAGE_EXTS and not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid photo type")
    if not suffix:
        suffix = ".jpg"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / filename
    _save_upload_file(file, file_path)
    return f"/uploads/students/{filename}"


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def _generate_enrollment_no(db: Session) -> str:
    date_part = datetime.utcnow().strftime("%Y%m%d")
    for _ in range(10):
        suffix = randint(1000, 9999)
        candidate = f"PRG-{date_part}-{suffix}"
        exists = db.query(Student).filter(Student.enrollment_no == candidate).first()
        if not exists:
            return candidate
    raise HTTPException(status_code=500, detail="Unable to generate enrollment number")


@router.get("/", response_model=list[StudentOut])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).order_by(Student.id.desc()).all()


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("/", response_model=StudentOut)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    data = payload.dict()
    enrollment_no = (data.get("enrollment_no") or "").strip() or None
    if enrollment_no:
        existing = db.query(Student).filter(Student.enrollment_no == enrollment_no).first()
        if existing:
            raise HTTPException(status_code=400, detail="Enrollment number already exists")
        data["enrollment_no"] = enrollment_no
    else:
        data["enrollment_no"] = _generate_enrollment_no(db)
    student = Student(**data)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.post("/upload", response_model=StudentOut)
def create_student_with_photo(
    photo: UploadFile = File(...),
    enrollment_no: str | None = Form(None),
    name: str = Form(...),
    father_name: str | None = Form(None),
    phone: str = Form(...),
    email: str | None = Form(None),
    address: str | None = Form(None),
    course_id: int | None = Form(None),
    dob: str | None = Form(None),
    join_date: str | None = Form(None),
    status: str = Form("active"),
    db: Session = Depends(get_db),
):
    if not father_name:
        raise HTTPException(status_code=400, detail="Father name is required")
    if not dob:
        raise HTTPException(status_code=400, detail="DOB is required")
    enrollment_no = (enrollment_no or "").strip() or None
    if enrollment_no:
        existing = db.query(Student).filter(Student.enrollment_no == enrollment_no).first()
        if existing:
            raise HTTPException(status_code=400, detail="Enrollment number already exists")
    else:
        enrollment_no = _generate_enrollment_no(db)
    photo_url = _save_student_photo(photo)
    student = Student(
        enrollment_no=enrollment_no,
        name=name,
        father_name=father_name,
        phone=phone,
        email=email or None,
        address=address or None,
        course_id=course_id,
        dob=_parse_date(dob),
        join_date=_parse_date(join_date),
        status=status,
        photo_url=photo_url,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)
    return student


@router.post("/{student_id}/photo", response_model=StudentOut)
def update_student_photo(
    student_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if student.photo_url and student.photo_url.startswith("/uploads/students/"):
        existing = UPLOAD_DIR / Path(student.photo_url).name
        if existing.exists():
            existing.unlink()

    student.photo_url = _save_student_photo(photo)
    db.commit()
    db.refresh(student)
    return student


@router.post("/{student_id}/set-password")
def set_student_password(
    student_id: int,
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.login_password_hash = get_password_hash(password)
    student.login_enabled = True
    db.commit()
    return {"status": "updated"}


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"status": "deleted"}
