from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.api.deps import get_current_student, get_current_user, get_db
from app.models.exam import Exam, ExamAnswer, ExamAttempt, ExamOption, ExamQuestion
from app.schemas.exam import (
    ExamAnswerSubmit,
    ExamAttemptOut,
    ExamCreate,
    ExamOut,
    ExamOptionOut,
    ExamOptionUpdate,
    ExamQuestionCreate,
    ExamQuestionOut,
    ExamQuestionUpdate,
    ExamStartResponse,
    ExamSubmitRequest,
    ExamSubmitResponse,
    ExamUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[ExamOut], dependencies=[Depends(get_current_user)])
def list_exams(db: Session = Depends(get_db)):
    return db.query(Exam).order_by(Exam.id.desc()).all()


@router.post("/", response_model=ExamOut, dependencies=[Depends(get_current_user)])
def create_exam(payload: ExamCreate, db: Session = Depends(get_db)):
    exam = Exam(**payload.dict())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.get("/{exam_id}", response_model=ExamOut, dependencies=[Depends(get_current_user)])
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


@router.put("/{exam_id}", response_model=ExamOut, dependencies=[Depends(get_current_user)])
def update_exam(exam_id: int, payload: ExamUpdate, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(exam, key, value)

    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/{exam_id}", dependencies=[Depends(get_current_user)])
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    db.query(ExamOption).filter(ExamOption.question_id.in_(
        db.query(ExamQuestion.id).filter(ExamQuestion.exam_id == exam_id)
    )).delete(synchronize_session=False)
    db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).delete()
    db.delete(exam)
    db.commit()
    return {"status": "deleted"}


@router.get("/{exam_id}/questions", response_model=list[ExamQuestionOut], dependencies=[Depends(get_current_user)])
def list_questions(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
    results = []
    for question in questions:
        options = db.query(ExamOption).filter(ExamOption.question_id == question.id).all()
        results.append(
            ExamQuestionOut(
                id=question.id,
                question_text=question.question_text,
                marks=float(question.marks) if question.marks is not None else 1,
                negative_marks=float(question.negative_marks) if question.negative_marks is not None else None,
                options=[
                    {"id": opt.id, "option_text": opt.option_text, "is_correct": opt.is_correct}
                    for opt in options
                ],
            )
        )
    return results


@router.post("/{exam_id}/questions", response_model=ExamQuestionOut, dependencies=[Depends(get_current_user)])
def create_question(exam_id: int, payload: ExamQuestionCreate, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    question = ExamQuestion(
        exam_id=exam_id,
        question_text=payload.question_text,
        marks=payload.marks,
        negative_marks=payload.negative_marks,
    )
    db.add(question)
    db.flush()

    if not payload.options:
        raise HTTPException(status_code=400, detail="Options are required")

    for opt in payload.options:
        option = ExamOption(
            question_id=question.id,
            option_text=opt.option_text,
            is_correct=opt.is_correct,
        )
        db.add(option)

    db.commit()
    db.refresh(question)

    options = db.query(ExamOption).filter(ExamOption.question_id == question.id).all()
    return ExamQuestionOut(
        id=question.id,
        question_text=question.question_text,
        marks=float(question.marks) if question.marks is not None else 1,
        negative_marks=float(question.negative_marks) if question.negative_marks is not None else None,
        options=[{"id": opt.id, "option_text": opt.option_text, "is_correct": opt.is_correct} for opt in options],
    )


@router.put("/questions/{question_id}", response_model=ExamQuestionOut, dependencies=[Depends(get_current_user)])
def update_question(question_id: int, payload: ExamQuestionUpdate, db: Session = Depends(get_db)):
    question = db.query(ExamQuestion).filter(ExamQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(question, key, value)

    db.commit()
    db.refresh(question)
    options = db.query(ExamOption).filter(ExamOption.question_id == question.id).all()
    return ExamQuestionOut(
        id=question.id,
        question_text=question.question_text,
        marks=float(question.marks) if question.marks is not None else 1,
        negative_marks=float(question.negative_marks) if question.negative_marks is not None else None,
        options=[{"id": opt.id, "option_text": opt.option_text, "is_correct": opt.is_correct} for opt in options],
    )


@router.delete("/questions/{question_id}", dependencies=[Depends(get_current_user)])
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = db.query(ExamQuestion).filter(ExamQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.query(ExamOption).filter(ExamOption.question_id == question_id).delete()
    db.delete(question)
    db.commit()
    return {"status": "deleted"}


@router.post("/questions/{question_id}/options", response_model=dict, dependencies=[Depends(get_current_user)])
def add_option(question_id: int, option_text: str, is_correct: bool = False, db: Session = Depends(get_db)):
    question = db.query(ExamQuestion).filter(ExamQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    option = ExamOption(question_id=question_id, option_text=option_text, is_correct=is_correct)
    db.add(option)
    db.commit()
    db.refresh(option)
    return {"id": option.id, "option_text": option.option_text, "is_correct": option.is_correct}


@router.put(
    "/questions/{question_id}/options/{option_id}",
    response_model=ExamOptionOut,
    dependencies=[Depends(get_current_user)],
)
def update_option(
    question_id: int,
    option_id: int,
    payload: ExamOptionUpdate,
    db: Session = Depends(get_db),
):
    option = (
        db.query(ExamOption)
        .filter(ExamOption.id == option_id, ExamOption.question_id == question_id)
        .first()
    )
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(option, key, value)

    db.commit()
    db.refresh(option)
    return option


@router.delete(
    "/questions/{question_id}/options/{option_id}",
    dependencies=[Depends(get_current_user)],
)
def delete_option(question_id: int, option_id: int, db: Session = Depends(get_db)):
    option = (
        db.query(ExamOption)
        .filter(ExamOption.id == option_id, ExamOption.question_id == question_id)
        .first()
    )
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")

    db.delete(option)
    db.commit()
    return {"status": "deleted"}


@router.get("/student/available", response_model=list[ExamOut], dependencies=[Depends(get_current_student)])
def list_available_exams(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    query = db.query(Exam).filter(Exam.is_active.is_(True))
    query = query.filter(
        and_(
            (Exam.start_at.is_(None) | (Exam.start_at <= now)),
            (Exam.end_at.is_(None) | (Exam.end_at >= now)),
        )
    )
    return query.order_by(Exam.id.desc()).all()


@router.post("/{exam_id}/start", response_model=ExamStartResponse, dependencies=[Depends(get_current_student)])
def start_exam(exam_id: int, db: Session = Depends(get_db), student=Depends(get_current_student)):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_active.is_(True)).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    attempt = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.student_id == student.id)
        .order_by(ExamAttempt.id.desc())
        .first()
    )
    if attempt and attempt.status == "submitted":
        raise HTTPException(status_code=400, detail="Exam already submitted")

    if not attempt:
        attempt = ExamAttempt(exam_id=exam_id, student_id=student.id, status="in_progress")
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

    questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
    question_out = []
    for q in questions:
        options = db.query(ExamOption).filter(ExamOption.question_id == q.id).all()
        question_out.append(
            {
                "id": q.id,
                "question_text": q.question_text,
                "marks": float(q.marks) if q.marks is not None else 1,
                "negative_marks": float(q.negative_marks) if q.negative_marks is not None else None,
                "options": [{"id": opt.id, "option_text": opt.option_text, "is_correct": False} for opt in options],
            }
        )

    return ExamStartResponse(attempt_id=attempt.id, exam=exam, questions=question_out)


@router.post("/{exam_id}/submit", response_model=ExamSubmitResponse, dependencies=[Depends(get_current_student)])
def submit_exam(
    exam_id: int,
    payload: ExamSubmitRequest,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    attempt = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.id == payload.attempt_id, ExamAttempt.exam_id == exam_id)
        .first()
    )
    if not attempt or attempt.student_id != student.id:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status == "submitted":
        raise HTTPException(status_code=400, detail="Exam already submitted")

    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    answers_map = {ans.question_id: ans.option_id for ans in payload.answers}
    total_score = 0.0

    questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
    for question in questions:
        selected_option_id = answers_map.get(question.id)
        if not selected_option_id:
            continue

        option = (
            db.query(ExamOption)
            .filter(ExamOption.id == selected_option_id, ExamOption.question_id == question.id)
            .first()
        )
        if not option:
            continue

        is_correct = option.is_correct
        marks = float(question.marks) if question.marks is not None else 1.0
        negative_value = 0.0
        if exam.negative_marking_enabled:
            if question.negative_marks is not None:
                negative_value = float(question.negative_marks)
            elif exam.negative_mark_value is not None:
                negative_value = float(exam.negative_mark_value)

        marks_awarded = marks if is_correct else -negative_value
        total_score += marks_awarded

        answer = ExamAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            option_id=option.id,
            is_correct=is_correct,
            marks_awarded=marks_awarded,
        )
        db.add(answer)

    attempt.status = "submitted"
    attempt.submitted_at = datetime.utcnow()
    attempt.total_score = total_score
    db.commit()

    return ExamSubmitResponse(attempt_id=attempt.id, total_score=total_score, status=attempt.status)


@router.get("/student/attempts", response_model=list[ExamAttemptOut], dependencies=[Depends(get_current_student)])
def list_student_attempts(db: Session = Depends(get_db), student=Depends(get_current_student)):
    return (
        db.query(ExamAttempt)
        .filter(ExamAttempt.student_id == student.id)
        .order_by(ExamAttempt.id.desc())
        .all()
    )
