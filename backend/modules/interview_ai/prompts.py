"""Prompt templates for the AI Interview module."""

from __future__ import annotations


def question_generation_prompt(
    role: str,
    skills: list[str],
    level: str,
    interview_type: str,
    question_count: int,
) -> str:
    return f"""
You are a senior technical interviewer.
Generate exactly {question_count} interview questions.

Role: {role}
Skills: {", ".join(skills) if skills else "Not specified"}
Experience level: {level}
Interview type: {interview_type}

Return strict JSON only in this format:
{{
  "questions": [
    "question 1",
    "question 2"
  ]
}}
"""


def answer_evaluation_prompt(question: str, answer: str, role: str, skills: list[str]) -> str:
    return f"""
You are a strict senior interviewer evaluating one candidate response.

Target role: {role}
Skills focus: {", ".join(skills) if skills else "Not specified"}
Question: {question}
Answer: {answer}

Evaluate with 0-100 scores for:
- correctness
- clarity
- relevance

Judgement rules:
- Be direct and evidence-based
- No motivational filler
- Penalize vague claims without implementation details
- Reward concrete examples, architecture reasoning, debugging method, and measurable impact

Return strict JSON only:
{{
  "correctness": 0,
  "clarity": 0,
  "relevance": 0,
  "feedback": "2-3 line detailed actionable feedback",
  "strengths": ["specific strong point 1", "specific strong point 2"],
  "gaps": ["specific gap 1", "specific gap 2"],
  "suggestions": [
    "specific improvement step 1",
    "specific improvement step 2",
    "specific improvement step 3"
  ],
  "model_answer_hint": "1-2 line example of what a stronger answer would include"
}}
"""
