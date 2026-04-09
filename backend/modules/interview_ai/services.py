"""Service layer for AI interview generation, evaluation, and scoring."""

from __future__ import annotations

import os
from statistics import mean
from typing import Any

from fastapi import HTTPException

from .prompts import answer_evaluation_prompt, question_generation_prompt
from .utils import (
    AnswerEvaluation,
    InterviewSession,
    clamp_score,
    new_session_id,
    safe_json_loads,
    store,
)


class InterviewAIService:
    """
    Extracted and refactored from PulseAI interview generation/evaluation flows:
    - question generation logic (PulseAI generate route)
    - feedback + scoring logic (PulseAI createFeedback action)
    """

    def _llm_generate(self, prompt: str) -> str:
        provider = os.getenv("AI_PROVIDER", "openai").strip().lower()

        if provider == "gemini":
            try:
                import google.generativeai as genai  # type: ignore
            except ImportError as exc:  # pragma: no cover
                raise HTTPException(status_code=500, detail="Gemini SDK not installed") from exc

            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY")

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
            response = model.generate_content(prompt)
            return response.text or ""

        try:
            from openai import OpenAI  # type: ignore
        except ImportError as exc:  # pragma: no cover
            raise HTTPException(status_code=500, detail="OpenAI SDK not installed") from exc

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")

        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        response = client.responses.create(model=model, input=prompt)
        return response.output_text

    def _fallback_question_set(self, role: str, skills: list[str], question_count: int) -> list[str]:
        seed = ", ".join(skills[:3]) if skills else "core fundamentals"
        base = [
            f"Introduce your experience relevant to the {role} role.",
            f"Explain a challenging problem you solved using {seed}.",
            "How do you approach debugging in production systems?",
            "Describe how you ensure code quality and maintainability.",
            "What trade-offs do you consider before choosing an architecture?",
        ]
        return base[:question_count]

    def _fallback_evaluation(self, question: str, answer: str, skills: list[str]) -> dict[str, Any]:
        answer_words = len(answer.split())
        keyword_hits = sum(1 for skill in skills if skill.lower() in answer.lower())
        clarity = 35 if answer_words < 15 else 65 if answer_words < 40 else 80
        relevance = 50 + min(keyword_hits * 10, 30)
        correctness = 55 if answer_words < 12 else 70
        return {
            "correctness": correctness,
            "clarity": clarity,
            "relevance": relevance,
            "feedback": f"Your answer to '{question}' is a good start, but add more specific technical depth.",
            "suggestions": [
                "Use STAR or a structured format.",
                "Include measurable impact from your work.",
                "Reference concrete tools, constraints, and outcomes.",
            ],
        }

    def start_interview(
        self,
        role: str,
        skills: list[str],
        level: str = "not specified",
        interview_type: str = "mixed",
        question_count: int = 5,
    ) -> InterviewSession:
        if not role:
            raise HTTPException(status_code=400, detail="role is required")
        if question_count <= 0 or question_count > 20:
            raise HTTPException(status_code=400, detail="question_count must be between 1 and 20")

        prompt = question_generation_prompt(role, skills, level, interview_type, question_count)

        questions: list[str]
        try:
            raw = self._llm_generate(prompt)
            parsed = safe_json_loads(raw)
            questions = parsed.get("questions", [])
            if not isinstance(questions, list) or not all(isinstance(q, str) for q in questions):
                raise ValueError("Invalid questions format")
            questions = questions[:question_count]
            if len(questions) < question_count:
                questions.extend(self._fallback_question_set(role, skills, question_count - len(questions)))
        except Exception:
            questions = self._fallback_question_set(role, skills, question_count)

        session = InterviewSession(
            session_id=new_session_id(),
            role=role,
            skills=skills,
            level=level,
            interview_type=interview_type,
            questions=questions,
        )
        store.create(session)
        return session

    def submit_answer(self, session_id: str, question_index: int, answer: str) -> AnswerEvaluation:
        session = store.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found")
        if question_index < 0 or question_index >= len(session.questions):
            raise HTTPException(status_code=400, detail="Invalid question_index")
        if not answer or not answer.strip():
            raise HTTPException(status_code=400, detail="answer is required")

        question = session.questions[question_index]
        prompt = answer_evaluation_prompt(question, answer, session.role, session.skills)

        try:
            raw = self._llm_generate(prompt)
            data = safe_json_loads(raw)
        except Exception:
            data = self._fallback_evaluation(question, answer, session.skills)

        correctness = clamp_score(data.get("correctness", 0))
        clarity = clamp_score(data.get("clarity", 0))
        relevance = clamp_score(data.get("relevance", 0))
        overall = clamp_score(mean([correctness, clarity, relevance]))
        feedback = str(data.get("feedback", "")).strip() or "Keep improving answer structure and technical clarity."
        suggestions = [str(item) for item in data.get("suggestions", [])][:5]

        evaluation = AnswerEvaluation(
            correctness=correctness,
            clarity=clarity,
            relevance=relevance,
            overall=overall,
            feedback=feedback,
            suggestions=suggestions,
            question_index=question_index,
            question=question,
            answer=answer.strip(),
        )
        session.answers.append(evaluation)
        return evaluation

    def get_result(self, session_id: str) -> dict[str, Any]:
        session = store.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found")

        if not session.answers:
            return {
                "session_id": session_id,
                "role": session.role,
                "scores": {"correctness": 0, "clarity": 0, "relevance": 0, "overall": 0},
                "summary_feedback": "No answers submitted yet.",
                "answered_count": 0,
                "total_questions": len(session.questions),
                "evaluations": [],
            }

        correctness_avg = clamp_score(mean(item.correctness for item in session.answers))
        clarity_avg = clamp_score(mean(item.clarity for item in session.answers))
        relevance_avg = clamp_score(mean(item.relevance for item in session.answers))
        overall_avg = clamp_score(mean(item.overall for item in session.answers))

        return {
            "session_id": session_id,
            "role": session.role,
            "scores": {
                "correctness": correctness_avg,
                "clarity": clarity_avg,
                "relevance": relevance_avg,
                "overall": overall_avg,
            },
            "summary_feedback": "Focus on concise structure, role-relevant examples, and technical depth.",
            "answered_count": len(session.answers),
            "total_questions": len(session.questions),
            "evaluations": [item.__dict__ for item in session.answers],
        }


service = InterviewAIService()
