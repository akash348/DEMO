from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.student import Student
from app.schemas.student_auth import StudentLoginRequest, StudentRegisterRequest, StudentToken

router = APIRouter()


@router.post("/register", response_model=StudentToken)
def register_student(payload: StudentRegisterRequest, db: Session = Depends(get_db)):
    student = (
        db.query(Student)
        .filter(Student.enrollment_no == payload.enrollment_no, Student.dob == payload.dob)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if student.login_enabled:
        raise HTTPException(status_code=400, detail="Login already enabled")

    student.login_password_hash = get_password_hash(payload.password)
    student.login_enabled = True
    db.commit()

    token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(subject=f"student:{student.id}", expires_delta=token_expires)
    return StudentToken(access_token=token)


@router.post("/login", response_model=StudentToken)
def login_student(payload: StudentLoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.enrollment_no == payload.enrollment_no).first()
    if not student or not student.login_enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login not enabled")
    if not student.login_password_hash or not verify_password(payload.password, student.login_password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(subject=f"student:{student.id}", expires_delta=token_expires)
    return StudentToken(access_token=token)
