from datetime import date
from pydantic import BaseModel


class CertificateVerifyRequest(BaseModel):
    enrollment_no: str
    dob: date


class CertificateVerifyResponse(BaseModel):
    enrollment_no: str
    student_name: str
    father_name: str | None = None
    dob: date
    photo_url: str | None = None
    course_title: str | None = None
    course_duration: str | None = None
    grade: str | None = None
    percentage: float | None = None
    certificate_code: str | None = None
    issued_on: date | None = None
    status: str | None = None
