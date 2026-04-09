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
You are evaluating a candidate interview response.

Target role: {role}
Skills focus: {", ".join(skills) if skills else "Not specified"}
Question: {question}
Answer: {answer}

Evaluate with 0-100 scores for:
- correctness
- clarity
- relevance

Return strict JSON only:
{{
  "correctness": 0,
  "clarity": 0,
  "relevance": 0,
  "feedback": "short actionable feedback",
  "suggestions": [
    "suggestion 1",
    "suggestion 2"
  ]
}}
"""
