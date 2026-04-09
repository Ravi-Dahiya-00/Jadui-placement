"""FastAPI routes for AI Interview module."""

from __future__ import annotations

from pydantic import BaseModel, Field
from fastapi import APIRouter

from .services import service


router = APIRouter(tags=["interview-ai"])


class StartInterviewRequest(BaseModel):
    role: str = Field(..., min_length=2, max_length=100)
    skills: list[str] = Field(default_factory=list)
    level: str = Field(default="not specified")
    interview_type: str = Field(default="mixed")
    question_count: int = Field(default=5, ge=1, le=20)


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_index: int = Field(..., ge=0)
    answer: str = Field(..., min_length=1)


@router.post("/interview/start")
def start_interview(payload: StartInterviewRequest) -> dict:
    session = service.start_interview(
        role=payload.role,
        skills=payload.skills,
        level=payload.level,
        interview_type=payload.interview_type,
        question_count=payload.question_count,
    )
    return session


@router.post("/interview/answer")
def submit_answer(payload: SubmitAnswerRequest) -> dict:
    result = service.submit_answer(
        session_id=payload.session_id,
        question_index=payload.question_index,
        answer=payload.answer,
    )
    return {"evaluation": result.__dict__}


@router.get("/interview/result")
def interview_result(session_id: str) -> dict:
    return service.get_result(session_id=session_id)


@router.get("/interview/history")
def interview_history(limit: int = 10) -> dict:
    return {"history": service.get_history(limit=limit)}
