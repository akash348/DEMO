from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.sql import func

from app.db.base import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    total_marks = Column(Numeric(8, 2), nullable=True)
    pass_marks = Column(Numeric(8, 2), nullable=True)
    negative_marking_enabled = Column(Boolean, default=False)
    negative_mark_value = Column(Numeric(6, 2), nullable=True)
    is_active = Column(Boolean, default=True)
    start_at = Column(DateTime(timezone=True), nullable=True)
    end_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    marks = Column(Numeric(6, 2), default=1)
    negative_marks = Column(Numeric(6, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExamOption(Base):
    __tablename__ = "exam_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, nullable=False, index=True)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, nullable=False, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    total_score = Column(Numeric(8, 2), nullable=True)
    status = Column(String(30), default="in_progress")


class ExamAnswer(Base):
    __tablename__ = "exam_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, nullable=False, index=True)
    question_id = Column(Integer, nullable=False, index=True)
    option_id = Column(Integer, nullable=False, index=True)
    is_correct = Column(Boolean, default=False)
    marks_awarded = Column(Numeric(6, 2), nullable=True)
