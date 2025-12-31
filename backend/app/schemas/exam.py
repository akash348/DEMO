from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int
    total_marks: Optional[float] = None
    pass_marks: Optional[float] = None
    negative_marking_enabled: bool = False
    negative_mark_value: Optional[float] = None
    is_active: bool = True
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[float] = None
    pass_marks: Optional[float] = None
    negative_marking_enabled: Optional[bool] = None
    negative_mark_value: Optional[float] = None
    is_active: Optional[bool] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class ExamOut(ExamBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class ExamOptionBase(BaseModel):
    option_text: str
    is_correct: bool = False


class ExamOptionCreate(ExamOptionBase):
    pass


class ExamOptionUpdate(BaseModel):
    option_text: Optional[str] = None
    is_correct: Optional[bool] = None


class ExamOptionOut(ExamOptionBase):
    id: int

    class Config:
        orm_mode = True


class ExamQuestionBase(BaseModel):
    question_text: str
    marks: float = 1
    negative_marks: Optional[float] = None


class ExamQuestionCreate(ExamQuestionBase):
    options: List[ExamOptionCreate]


class ExamQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    marks: Optional[float] = None
    negative_marks: Optional[float] = None


class ExamQuestionOut(ExamQuestionBase):
    id: int
    options: List[ExamOptionOut] = []

    class Config:
        orm_mode = True


class ExamAttemptOut(BaseModel):
    id: int
    exam_id: int
    student_id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    total_score: Optional[float] = None
    status: str

    class Config:
        orm_mode = True


class ExamStartResponse(BaseModel):
    attempt_id: int
    exam: ExamOut
    questions: List[ExamQuestionOut]


class ExamAnswerSubmit(BaseModel):
    question_id: int
    option_id: int


class ExamSubmitRequest(BaseModel):
    attempt_id: int
    answers: List[ExamAnswerSubmit]


class ExamSubmitResponse(BaseModel):
    attempt_id: int
    total_score: float
    status: str
