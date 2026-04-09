"""GitHub profile analytics API."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from .services import build_profile, can_load_quick

router = APIRouter(tags=["github-profile"])


@router.get("/github/can-load")
def github_can_load(user: str = Query(..., min_length=1, max_length=39)) -> dict[str, Any]:
    return {"ok": can_load_quick(user)}


@router.get("/github/profile/{username}")
def github_profile(
    username: str,
    insights: bool = Query(False, description="Include Gemini summary when GEMINI_API_KEY is set"),
) -> dict[str, Any]:
    return build_profile(username, include_insights=insights)
