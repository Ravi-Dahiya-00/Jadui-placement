"""Utility models and helpers for interview session management."""

from __future__ import annotations

import json
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_session_id() -> str:
    return str(uuid.uuid4())


def safe_json_loads(raw: str) -> dict[str, Any]:
    """Parse JSON robustly even if model wraps extra markdown blocks."""
    raw = raw.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw, re.DOTALL)
    if fenced:
        raw = fenced.group(1)
    try:
        return json.loads(raw)
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(raw[start : end + 1])
        raise


def clamp_score(value: float | int) -> int:
    return max(0, min(100, int(round(float(value)))))


@dataclass
class AnswerEvaluation:
    correctness: int
    clarity: int
    relevance: int
    overall: int
    feedback: str
    suggestions: list[str]
    question_index: int
    question: str
    answer: str
    created_at: str = field(default_factory=utc_now_iso)


@dataclass
class InterviewSession:
    session_id: str
    role: str
    skills: list[str]
    level: str
    interview_type: str
    questions: list[str]
    answers: list[AnswerEvaluation] = field(default_factory=list)
    created_at: str = field(default_factory=utc_now_iso)
