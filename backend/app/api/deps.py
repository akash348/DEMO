from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.student import Student
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
student_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/student-auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    return user


def get_current_student(
    token: str = Depends(student_oauth2_scheme),
    db: Session = Depends(get_db),
) -> Student:
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if not subject or not str(subject).startswith("student:"):
            raise ValueError("Invalid subject")
        student_id = int(str(subject).split(":", 1)[1])
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or not student.login_enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive student")
    return student
