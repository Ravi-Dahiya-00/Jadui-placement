"""GitHub profile analytics API."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from .services import build_profile, can_load_quick

router = APIRouter(tags=["github-profile"])


@router.get("/github/can-load")
def github_can_load(user: str = Query(..., min_length=1, max_length=39)) -> dict[str, Any]:
    return {"ok": can_load_quick(user)}


@router.get("/github/profile")
def github_profile(
    username: str = Query(..., min_length=1, max_length=39),
    user_id: str = Query(None, description="Jadui User ID for profile synchronization"),
    insights: bool = Query(False, description="Include Gemini summary when GEMINI_API_KEY is set"),
) -> dict[str, Any]:
    profile = build_profile(username, include_insights=insights)
    
    # Sync with global state if user_id provided
    if user_id:
        try:
            from .sync_bridge import sync_github_insights # Wait, I put it in system_ai.sync
            from modules.system_ai.sync import sync_github_insights
            sync_github_insights(user_id, profile)
        except Exception as e:
            print(f"GitHub synchronization skipped: {e}")
            
    return profile
