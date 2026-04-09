"""LLM prompt templates for semantic resume intelligence."""

from __future__ import annotations


def semantic_resume_analysis_prompt(
    resume_text: str,
    target_role: str,
    target_skills: list[str],
) -> str:
    skills = ", ".join(target_skills) if target_skills else "Not specified"
    return f"""
You are an expert recruiter and career coach.
Analyze the resume semantically for role fit.

Target role: {target_role}
Target skills: {skills}

Resume text:
{resume_text}

Return STRICT JSON only:
{{
  "experience_level": "entry|junior|mid|senior|lead",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommended_roles": ["..."],
  "skill_gap": ["..."],
  "score": 0
}}

Scoring rubric:
- 0-49: weak fit
- 50-74: moderate fit
- 75-100: strong fit
"""
