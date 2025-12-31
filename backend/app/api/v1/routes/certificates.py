from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.student import Student
from app.schemas.certificate import CertificateCreate, CertificateOut, CertificateUpdate
from app.schemas.certificate_verify import CertificateVerifyRequest, CertificateVerifyResponse

router = APIRouter()


@router.get("/", response_model=list[CertificateOut], dependencies=[Depends(get_current_user)])
def list_certificates(db: Session = Depends(get_db)):
    return db.query(Certificate).order_by(Certificate.id.desc()).all()


@router.post("/", response_model=CertificateOut, dependencies=[Depends(get_current_user)])
def create_certificate(payload: CertificateCreate, db: Session = Depends(get_db)):
    existing = db.query(Certificate).filter(Certificate.certificate_code == payload.certificate_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Certificate code already exists")

    certificate = Certificate(**payload.dict())
    db.add(certificate)
    db.commit()
    db.refresh(certificate)
    return certificate


@router.put("/{certificate_id}", response_model=CertificateOut, dependencies=[Depends(get_current_user)])
def update_certificate(certificate_id: int, payload: CertificateUpdate, db: Session = Depends(get_db)):
    certificate = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(certificate, key, value)

    db.commit()
    db.refresh(certificate)
    return certificate


@router.get("/verify/{code}")
def verify_certificate(code: str, db: Session = Depends(get_db)):
    certificate = db.query(Certificate).filter(Certificate.certificate_code == code).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    student = db.query(Student).filter(Student.id == certificate.student_id).first()
    course = db.query(Course).filter(Course.id == certificate.course_id).first()
    return {
        "certificate_code": certificate.certificate_code,
        "status": certificate.status,
        "issued_on": certificate.issued_on,
        "student_id": certificate.student_id,
        "course_id": certificate.course_id,
        "qr_url": certificate.qr_url,
        "grade": certificate.grade,
        "percentage": certificate.percentage,
        "student_name": student.name if student else None,
        "father_name": student.father_name if student else None,
        "enrollment_no": student.enrollment_no if student else None,
        "dob": student.dob if student else None,
        "photo_url": student.photo_url if student else None,
        "course_title": course.title if course else None,
        "course_duration": course.duration if course else None,
    }


@router.post("/verify/enrollment", response_model=CertificateVerifyResponse)
def verify_certificate_by_enrollment(payload: CertificateVerifyRequest, db: Session = Depends(get_db)):
    student = (
        db.query(Student)
        .filter(Student.enrollment_no == payload.enrollment_no, Student.dob == payload.dob)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    certificate = (
        db.query(Certificate)
        .filter(Certificate.student_id == student.id)
        .order_by(Certificate.id.desc())
        .first()
    )
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    course = db.query(Course).filter(Course.id == certificate.course_id).first()
    return CertificateVerifyResponse(
        enrollment_no=student.enrollment_no or payload.enrollment_no,
        student_name=student.name,
        father_name=student.father_name,
        dob=student.dob or payload.dob,
        photo_url=student.photo_url,
        course_title=course.title if course else None,
        course_duration=course.duration if course else None,
        grade=certificate.grade,
        percentage=float(certificate.percentage) if certificate.percentage is not None else None,
        certificate_code=certificate.certificate_code,
        issued_on=certificate.issued_on,
        status=certificate.status,
    )


@router.delete("/{certificate_id}", dependencies=[Depends(get_current_user)])
def delete_certificate(certificate_id: int, db: Session = Depends(get_db)):
    certificate = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    db.delete(certificate)
    db.commit()
    return {"status": "deleted"}
