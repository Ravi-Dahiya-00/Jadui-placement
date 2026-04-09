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

@router.post("/github/review/pr")
async def review_pull_request(payload: PRReviewRequest):
    """Triggers an AI code review for a given GitHub PR."""
    try:
        # Parse URL
        parts = payload.repo_url.rstrip("/").split("/")
        if len(parts) < 2:
             raise HTTPException(status_code=400, detail="Invalid GitHub Repository URL")
        
        repo = parts[-1]
        owner = parts[-2]
        
        # 1. Fetch Diff
        diff_text = await service.fetch_pr_diff(owner, repo, payload.pr_number)
        
        # 2. AI Analysis
        analysis = await service.analyze_diff(diff_text)
        
        # 3. Save to database
        saved = service.save_review(
            user_id=payload.user_id,
            owner=owner,
            repo=repo,
            pr_number=payload.pr_number,
            review=analysis
        )
        
        return {"review": saved}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"PR Review Route Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/github/review/history")
def get_user_review_history(user_id: str = Query(...), limit: int = 10):
    """Fetches past PR reviews for the user."""
    history = service.get_history(user_id, limit)
    return {"history": history}
