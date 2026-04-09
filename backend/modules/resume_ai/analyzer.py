"""Deterministic analysis + optional LLM enhancement for resume intelligence."""

from __future__ import annotations

import os
import re
from typing import Any

from fastapi import HTTPException

from .prompts import semantic_resume_analysis_prompt
from .utils import normalize_space, safe_json_from_text


COMMON_SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node.js",
    "fastapi",
    "django",
    "flask",
    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "git",
    "redis",
    "spark",
    "hadoop",
    "airflow",
    "machine learning",
}


class ResumeAnalyzer:
    def extract_skills(self, text: str) -> list[str]:
        norm = text.lower()
        found = [s for s in COMMON_SKILLS if s in norm]
        return sorted(found)

    def extract_projects(self, text: str) -> list[str]:
        lines = [line.strip("- ").strip() for line in text.splitlines() if line.strip()]
        keywords = ("project", "built", "developed", "implemented", "designed")
        projects = [line for line in lines if any(k in line.lower() for k in keywords)]
        return projects[:5]

    def infer_experience_level(self, text: str) -> str:
        norm = text.lower()
        match = re.search(r"(\d+)\+?\s+years?", norm)
        years = int(match.group(1)) if match else 0
        if years >= 10:
            return "lead"
        if years >= 6:
            return "senior"
        if years >= 3:
            return "mid"
        if years >= 1:
            return "junior"
        return "entry"

    def compute_skill_gap(self, extracted_skills: list[str], target_skills: list[str]) -> list[str]:
        if not target_skills:
            return []
        extracted = {s.lower() for s in extracted_skills}
        return [s for s in target_skills if s.lower() not in extracted]

    def _llm_semantic_analysis(self, resume_text: str, role_target: str, target_skills: list[str]) -> dict[str, Any]:
        provider = os.getenv("AI_PROVIDER", "openai").lower()
        prompt = semantic_resume_analysis_prompt(resume_text, role_target, target_skills)

        if provider == "gemini":
            try:
                import google.generativeai as genai  # type: ignore
            except ImportError as exc:
                raise HTTPException(status_code=500, detail="Gemini SDK not installed") from exc
            key = os.getenv("GEMINI_API_KEY")
            if not key:
                raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY")
            genai.configure(api_key=key)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
            raw = model.generate_content(prompt).text or "{}"
            return safe_json_from_text(raw)

        try:
            from openai import OpenAI  # type: ignore
        except ImportError as exc:
            raise HTTPException(status_code=500, detail="OpenAI SDK not installed") from exc
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")
        client = OpenAI(api_key=key)
        resp = client.responses.create(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), input=prompt)
        return safe_json_from_text(resp.output_text or "{}")

    def analyze(
        self,
        resume_text: str,
        role_target: str,
        target_skills: list[str],
        use_llm: bool = True,
    ) -> dict[str, Any]:
        cleaned = normalize_space(resume_text)
        skills = self.extract_skills(cleaned)
        projects = self.extract_projects(resume_text)
        exp = self.infer_experience_level(cleaned)
        gap = self.compute_skill_gap(skills, target_skills)

        deterministic = {
            "skills": skills,
            "projects": projects,
            "experience_level": exp,
            "strengths": [
                "Demonstrates relevant technical stack exposure." if skills else "Resume structure is present.",
                "Project descriptions show implementation context." if projects else "Profile provides baseline information.",
            ],
            "weaknesses": ["Missing target skills: " + ", ".join(gap)] if gap else [],
            "recommended_roles": [role_target] if role_target else ["Software Engineer"],
            "skill_gap": gap,
            "score": max(0, min(100, 100 - (len(gap) * 10))),
        }

        if not use_llm:
            return deterministic

        try:
            semantic = self._llm_semantic_analysis(cleaned[:12000], role_target, target_skills)
            return {
                "skills": skills,
                "projects": projects,
                "experience_level": semantic.get("experience_level", deterministic["experience_level"]),
                "strengths": semantic.get("strengths", deterministic["strengths"])[:3],
                "weaknesses": semantic.get("weaknesses", deterministic["weaknesses"])[:3],
                "recommended_roles": semantic.get("recommended_roles", deterministic["recommended_roles"])[:5],
                "skill_gap": semantic.get("skill_gap", deterministic["skill_gap"])[:10],
                "score": int(semantic.get("score", deterministic["score"])),
            }
        except Exception:
            return deterministic


analyzer = ResumeAnalyzer()
