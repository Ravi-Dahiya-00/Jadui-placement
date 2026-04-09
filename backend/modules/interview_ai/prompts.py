"""Prompt templates for the AI Interview module."""

from __future__ import annotations


def _role_display(role: str) -> str:
    """Map short role ids from the UI to interviewer-facing labels."""
    key = (role or "").strip().lower()
    mapping = {
        "sde": "Software / Backend Engineer",
        "frontend": "Frontend / React Engineer",
        "fullstack": "Full Stack Engineer",
        "data": "Data Science / ML Engineer",
        "networking": "System Design / Infrastructure",
        "pm": "Product Manager",
    }
    return mapping.get(key, role or "Software Engineer")


def question_generation_prompt(
    role: str,
    skills: list[str],
    level: str,
    interview_type: str,
    question_count: int,
) -> str:
    display_role = _role_display(role)
    skills_line = ", ".join(skills) if skills else "Infer realistic tools/stacks for this role if not listed"
    return f"""You are a senior hiring manager and staff-level interviewer at a top tech company.
Your tone is professional, specific, and challenging — not generic or textbook.

Target role (canonical): {display_role}
Raw role id from UI: {role}
Skills / stack hints: {skills_line}
Experience level: {level}
Interview type focus: {interview_type}

Generate exactly {question_count} DISTINCT interview questions for a LIVE mock interview.

Hard requirements for EACH question:
- Minimum 2 sentences OR one sentence with 2+ clauses that force depth (no one-liners like "What is X?").
- At least one of: concrete scenario, system constraints, trade-offs, metrics, failure/rollback, or stakeholder conflict.
- Mix question styles across the list: at least one behavioral (STAR-ready), at least one technical depth, at least one system/design or process question (adapt to role — e.g. ML experiment design for data roles).
- Reference the role and (when possible) the skills stack explicitly so questions feel tailored.
- Avoid duplicates, filler, and definitions-only questions. Do NOT ask "Tell me about yourself" as more than one question; if you include an intro question, make it specific to this role.

Return STRICT JSON only, no markdown, no commentary:
{{
  "questions": [
    "question 1 text",
    "question 2 text"
  ]
}}
"""


def answer_evaluation_prompt(question: str, answer: str, role: str, skills: list[str]) -> str:
    display_role = _role_display(role)
    skills_line = ", ".join(skills) if skills else "Not specified"
    return f"""You are a strict staff-level interviewer scoring ONE candidate answer.

Target role: {display_role}
Skills focus: {skills_line}

Interview question:
{question}

Candidate answer (verbatim):
{answer}

Score 0-100 for each dimension (integers):
- correctness: factual/technical soundness and completeness for the question.
- clarity: structure, precision, no hand-waving; penalize vague claims with no mechanism.
- relevance: answers what was asked; uses role-relevant examples and stack where appropriate.

Rules:
- Be direct and evidence-based. No motivational filler.
- Penalize answers with no concrete example, no trade-offs, no measurable outcome when the question asked for depth.
- Reward PAR/STAR structure, debugging method, architecture reasoning, and quantified impact.

Return STRICT JSON only, no markdown:
{{
  "correctness": 0,
  "clarity": 0,
  "relevance": 0,
  "feedback": "2-4 sentences: what worked, what missed the bar, what to add next time",
  "strengths": ["specific strength 1", "specific strength 2"],
  "gaps": ["specific gap 1", "specific gap 2"],
  "suggestions": [
    "actionable improvement 1",
    "actionable improvement 2",
    "actionable improvement 3"
  ],
  "model_answer_hint": "1-3 sentences: outline of a strong answer for THIS question"
}}
"""
