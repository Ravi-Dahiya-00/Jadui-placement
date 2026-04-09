"""Mentor chat API — used by Next.js when GEMINI_API_KEY lives on Render only."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from .services import service

router = APIRouter(tags=["mentor-ai"])


class MentorChatMessage(BaseModel):
    role: str = "user"
    content: str = ""


class MentorChatRequest(BaseModel):
    """Pre-built system prompt from Next (includes dashboard context)."""

    system_prompt: str = Field(..., min_length=10, max_length=120000)
    message: str = Field(..., min_length=1, max_length=8000)
    history: list[MentorChatMessage] = Field(default_factory=list)


@router.post("/mentor/chat")
def mentor_chat(payload: MentorChatRequest) -> dict[str, Any]:
    hist = [m.model_dump() for m in payload.history]
    text = service.generate_reply(payload.system_prompt, hist, payload.message)
    return {"message": text, "usedAI": True, "source": "backend"}
