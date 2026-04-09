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


class FeedbackRequest(BaseModel):
    interviewId: str
    userId: str
    transcript: list[dict[str, Any]]

@router.post("/interview/feedback")
def generate_feedback(payload: FeedbackRequest) -> dict:
    """
    Analyzes the full transcript from a live session.
    Triggers global sync for skill gaps found during the conversation.
    """
    result = service.generate_feedback_from_transcript(
        session_id=payload.interviewId,
        user_id=payload.userId,
        transcript=payload.transcript
    )
    
    # Sync triggers are handled inside the service method
    return {"feedback": result}


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
def interview_result(session_id: str, user_id: str = None) -> dict:
    result = service.get_result(session_id=session_id)
    
    # Sync with global state if user_id provided
    if user_id:
        try:
            from modules.system_ai.sync import sync_interview_insights
            # Collect all gaps from individual evaluations
            all_gaps = []
            evals = result.get("evaluations", [])
            for e in evals:
                all_gaps.extend(e.get("gaps", []))
            
            if all_gaps:
                sync_interview_insights(user_id, list(set(all_gaps))[:5])
        except Exception as e:
            print(f"Interview synchronization failed: {e}")
            
    return result


@router.get("/interview/history")
def interview_history(limit: int = 10) -> dict:
    return {"history": service.get_history(limit=limit)}
