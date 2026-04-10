"""FastAPI routes for Resume Intelligence Engine."""

from __future__ import annotations

from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel, Field

from .services import service


router = APIRouter(tags=["resume-ai"])


class AnalyzeResumeRequest(BaseModel):
    user_id: str
    file_id: str
    role_target: str = Field(default="Software Engineer")
    target_skills: list[str] = Field(default_factory=list)
    use_llm: bool = True


@router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...)) -> dict:
    record = await service.upload_resume(file)
    return {
        "file_id": record.file_id,
        "filename": record.filename,
        "candidate_name": record.candidate_name,
        "text_preview": record.text[:500],
    }


@router.post("/resume/analyze")
def analyze_resume(payload: AnalyzeResumeRequest) -> dict:
    result = service.analyze_resume(
        user_id=payload.user_id,
        file_id=payload.file_id,
        role_target=payload.role_target,
        target_skills=payload.target_skills,
        use_llm=payload.use_llm,
    )
    return {"result_id": result.result_id, "analysis": result.__dict__}


class PatchResumeRequest(BaseModel):
    result_id: str
    add_strengths: list[str] = Field(default_factory=list)

@router.patch("/resume/result")
def patch_resume_result(payload: PatchResumeRequest) -> dict:
    """
    Updates an existing resume results with AI-enhanced suggestions.
    """
    result = service.patch_result(
        result_id=payload.result_id,
        add_strengths=payload.add_strengths
    )
    return {"status": "updated", "result": result.__dict__}

@router.get("/resume/result")
def get_resume_result(result_id: str) -> dict:
    result = service.get_result(result_id)
    return {"result": result.__dict__}


@router.get("/resume/history")
def get_resume_history(user_id: str | None = None, limit: int = 10) -> dict:
    return {"history": service.get_history(user_id=user_id, limit=limit)}
