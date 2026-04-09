"""API Routes for GitHub PR Code Review."""

from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from .services import service

router = APIRouter(tags=["github-review"])

class PRReviewRequest(BaseModel):
    user_id: str
    repo_url: str # e.g. https://github.com/owner/repo
    pr_number: int

class RepoAnalysisRequest(BaseModel):
    user_id: str
    repo_url: str

@router.post("/github/review/pr")
async def review_pull_request(payload: PRReviewRequest):
    """Triggers an AI code review for a given GitHub PR."""
    try:
        parts = payload.repo_url.rstrip("/").split("/")
        if len(parts) < 2:
             raise HTTPException(status_code=400, detail="Invalid GitHub Repository URL")
        repo, owner = parts[-1], parts[-2]
        
        diff_text = await service.fetch_pr_diff(owner, repo, payload.pr_number)
        analysis = await service.analyze_diff(diff_text)
        saved = service.save_review(payload.user_id, owner, repo, payload.pr_number, analysis)
        return {"review": saved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/github/analyze/repo")
async def analyze_repository(payload: RepoAnalysisRequest):
    """Triggers a project-wide architecture review."""
    try:
        parts = payload.repo_url.rstrip("/").split("/")
        if len(parts) < 2:
             raise HTTPException(status_code=400, detail="Invalid GitHub Repository URL")
        repo, owner = parts[-1], parts[-2]
        
        metadata = await service.fetch_repo_metadata(owner, repo)
        analysis = await service.analyze_repo(metadata)
        saved = service.save_repo_analysis(payload.user_id, owner, repo, analysis)
        return {"analysis": saved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/github/review/history")
def get_user_review_history(user_id: str = Query(...), limit: int = 10):
    return {"history": service.get_history(user_id, limit)}

@router.get("/github/analyze/history")
def get_repo_analysis_history(user_id: str = Query(...), limit: int = 10):
    return {"history": service.get_repo_history(user_id, limit)}
