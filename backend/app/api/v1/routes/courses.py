from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseOut, CourseUpdate

router = APIRouter()


@router.get("/", response_model=list[CourseOut])
def list_courses(
    active_only: bool = True,
    trade_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Course)
    if active_only:
        query = query.filter(Course.is_active.is_(True))
    if trade_id:
        query = query.filter(Course.trade_id == trade_id)
    return query.order_by(Course.id.desc()).all()


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/", response_model=CourseOut, dependencies=[Depends(get_current_user)])
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    course = Course(**payload.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseOut, dependencies=[Depends(get_current_user)])
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", dependencies=[Depends(get_current_user)])
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return {"status": "deleted"}
