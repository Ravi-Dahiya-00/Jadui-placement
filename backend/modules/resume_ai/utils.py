"""Utility helpers and typed models for resume module."""

from __future__ import annotations

import io
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def extract_name_from_filename(filename: str) -> str:
    """
    Reused from HireLens filename logic:
    alice_chen_resume.pdf -> Alice Chen
    """
    base = re.sub(r"\.[^/.]+$", "", filename or "")
    base = re.sub(r"[-_]", " ", base)
    base = re.sub(r"resume|cv|curriculum", "", base, flags=re.IGNORECASE).strip()
    words = [w for w in base.split() if w]
    return " ".join(word[:1].upper() + word[1:].lower() for word in words) or "Unknown Candidate"


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def safe_json_from_text(raw: str) -> dict[str, Any]:
    import json

    raw = (raw or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        raw = raw.replace("json", "", 1).strip()
    return json.loads(raw)


@dataclass
class ResumeFileRecord:
    file_id: str
    filename: str
    mime_type: str
    candidate_name: str
    text: str
    created_at: str = field(default_factory=utc_now_iso)


@dataclass
class ResumeAnalysisRecord:
    result_id: str
    file_id: str
    role_target: str
    skills: list[str]
    projects: list[str]
    experience_level: str
    strengths: list[str]
    weaknesses: list[str]
    recommended_roles: list[str]
    skill_gap: list[str]
    score: int
    section_reviews: list[dict[str, Any]] = field(default_factory=list)
    created_at: str = field(default_factory=utc_now_iso)


def bytes_to_stream(data: bytes) -> io.BytesIO:
    return io.BytesIO(data)
