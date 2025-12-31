from datetime import date
from pydantic import BaseModel


class StudentRegisterRequest(BaseModel):
    enrollment_no: str
    dob: date
    password: str


class StudentLoginRequest(BaseModel):
    enrollment_no: str
    password: str


class StudentToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
