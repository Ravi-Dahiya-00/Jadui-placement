"""Service layer for AI interview generation, evaluation, and scoring."""

from __future__ import annotations

import os
from statistics import mean
from typing import Any

from fastapi import HTTPException

from app.core.supabase_client import get_supabase_admin_client
from .prompts import answer_evaluation_prompt, question_generation_prompt
from .utils import (
    AnswerEvaluation,
    clamp_score,
    new_session_id,
    safe_json_loads,
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
        answer_l = answer.lower()
        answer_words = len(answer.split())
        keyword_hits = sum(1 for skill in skills if skill.lower() in answer_l)
        has_structure = any(token in answer_l for token in ["first", "then", "finally", "because", "therefore"])
        has_metrics = bool(any(ch.isdigit() for ch in answer) or "%" in answer)
        has_debug_terms = any(token in answer_l for token in ["logs", "metrics", "trace", "rollback", "monitor"])

        clarity = 35 if answer_words < 15 else 62 if answer_words < 35 else 78
        if has_structure:
            clarity += 6
        relevance = 45 + min(keyword_hits * 12, 30)
        if "debug" in question.lower() and has_debug_terms:
            relevance += 10
        correctness = 50 if answer_words < 12 else 66
        if has_metrics:
            correctness += 8

        strengths: list[str] = []
        if has_structure:
            strengths.append("Answer has a visible structure and logical flow.")
        if keyword_hits > 0:
            strengths.append("Response references role-relevant technologies.")
        if has_metrics:
            strengths.append("Includes measurable signal, improving credibility.")
        if not strengths:
            strengths.append("Basic relevance is present, but depth is limited.")

        gaps: list[str] = []
        if not has_structure:
            gaps.append("Lacks clear structure (context -> action -> result).")
        if not has_metrics:
            gaps.append("Missing measurable impact (latency, throughput, reliability, % improvement).")
        if keyword_hits == 0 and skills:
            gaps.append("Does not connect answer to expected skill stack.")

        q_lower = question.lower()
        if "debug" in q_lower:
            model_hint = "A strong answer should cover reproduction, hypothesis, logs/metrics, root cause, fix, and prevention."
        elif "challenging problem" in q_lower:
            model_hint = "A strong answer should state problem constraints, design decision, trade-off, and measurable outcome."
        else:
            model_hint = "A strong answer should include context, technical implementation detail, and quantifiable result."

        return {
            "correctness": clamp_score(correctness),
            "clarity": clamp_score(clarity),
            "relevance": clamp_score(relevance),
            "feedback": (
                f"For '{question}', your response covers basics but lacks interview-grade depth. "
                "Add implementation detail, explicit trade-offs, and quantified impact."
            ),
            "strengths": strengths[:3],
            "gaps": gaps[:3],
            "suggestions": [
                "Use PAR/STAR structure: problem, action, result.",
                "Mention concrete tools, architecture choices, and constraints.",
                "Add one measurable metric to prove impact.",
            ],
            "model_answer_hint": model_hint,
        }

    def _get_session_row(self, session_id: str) -> dict[str, Any]:
        supabase = get_supabase_admin_client()
        resp = (
            supabase.table("interview_sessions")
            .select("*")
            .eq("id", session_id)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Interview session not found")
        return rows[0]

    def _get_answer_rows(self, session_id: str) -> list[dict[str, Any]]:
        supabase = get_supabase_admin_client()
        resp = (
            supabase.table("interview_answers")
            .select("*")
            .eq("session_id", session_id)
            .order("question_index")
            .execute()
        )
        return resp.data or []

    def start_interview(
        self,
        role: str,
        skills: list[str],
        level: str = "not specified",
        interview_type: str = "mixed",
        question_count: int = 5,
    ) -> dict[str, Any]:
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

        session_id = new_session_id()
        supabase = get_supabase_admin_client()
        supabase.table("interview_sessions").insert(
            {
                "id": session_id,
                "role": role,
                "skills": skills,
                "level": level,
                "interview_type": interview_type,
                "questions": questions,
            }
        ).execute()
        return {
            "session_id": session_id,
            "role": role,
            "skills": skills,
            "level": level,
            "interview_type": interview_type,
            "questions": questions,
        }

    def submit_answer(self, session_id: str, question_index: int, answer: str) -> AnswerEvaluation:
        session = self._get_session_row(session_id)
        questions = session.get("questions") or []
        if question_index < 0 or question_index >= len(questions):
            raise HTTPException(status_code=400, detail="Invalid question_index")
        if not answer or not answer.strip():
            raise HTTPException(status_code=400, detail="answer is required")

        question = questions[question_index]
        prompt = answer_evaluation_prompt(
            question,
            answer,
            session.get("role", ""),
            session.get("skills") or [],
        )

        try:
            raw = self._llm_generate(prompt)
            data = safe_json_loads(raw)
        except Exception:
            data = self._fallback_evaluation(question, answer, session.get("skills") or [])

        correctness = clamp_score(data.get("correctness", 0))
        clarity = clamp_score(data.get("clarity", 0))
        relevance = clamp_score(data.get("relevance", 0))
        overall = clamp_score(mean([correctness, clarity, relevance]))
        feedback = str(data.get("feedback", "")).strip() or "Answer needs stronger technical depth and structure."
        strengths = [str(item).strip() for item in data.get("strengths", []) if str(item).strip()][:3]
        gaps = [str(item).strip() for item in data.get("gaps", []) if str(item).strip()][:3]
        suggestions = [str(item).strip() for item in data.get("suggestions", []) if str(item).strip()][:5]
        model_answer_hint = str(data.get("model_answer_hint", "")).strip()
        if strengths:
            feedback = f"{feedback} Strength: {strengths[0]}"
        if gaps:
            feedback = f"{feedback} Gap: {gaps[0]}"
        if model_answer_hint:
            suggestions = suggestions + [f"Model answer hint: {model_answer_hint}"]
        suggestions = suggestions[:5]

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
        get_supabase_admin_client().table("interview_answers").insert(
            {
                "session_id": session_id,
                "question_index": question_index,
                "question": question,
                "answer": evaluation.answer,
                "correctness": evaluation.correctness,
                "clarity": evaluation.clarity,
                "relevance": evaluation.relevance,
                "overall": evaluation.overall,
                "feedback": evaluation.feedback,
                "suggestions": evaluation.suggestions,
            }
        ).execute()
        return evaluation

    def get_result(self, session_id: str) -> dict[str, Any]:
        session = self._get_session_row(session_id)
        answers = self._get_answer_rows(session_id)

        if not answers:
            return {
                "session_id": session_id,
                "role": session.get("role", ""),
                "scores": {"correctness": 0, "clarity": 0, "relevance": 0, "overall": 0},
                "summary_feedback": "No answers submitted yet.",
                "answered_count": 0,
                "total_questions": len(session.get("questions") or []),
                "evaluations": [],
            }

        correctness_avg = clamp_score(mean(int(item.get("correctness", 0)) for item in answers))
        clarity_avg = clamp_score(mean(int(item.get("clarity", 0)) for item in answers))
        relevance_avg = clamp_score(mean(int(item.get("relevance", 0)) for item in answers))
        overall_avg = clamp_score(mean(int(item.get("overall", 0)) for item in answers))

        return {
            "session_id": session_id,
            "role": session.get("role", ""),
            "scores": {
                "correctness": correctness_avg,
                "clarity": clarity_avg,
                "relevance": relevance_avg,
                "overall": overall_avg,
            },
            "summary_feedback": "Focus on concise structure, role-relevant examples, and technical depth.",
            "answered_count": len(answers),
            "total_questions": len(session.get("questions") or []),
            "evaluations": answers,
        }

    def get_history(self, limit: int = 10) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 50))
        sessions_resp = (
            get_supabase_admin_client()
            .table("interview_sessions")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        sessions = sessions_resp.data or []
        history: list[dict[str, Any]] = []
        for session in sessions:
            session_id = session.get("id")
            answers = self._get_answer_rows(session_id)
            if answers:
                overall = clamp_score(mean(int(item.get("overall", 0)) for item in answers))
            else:
                overall = 0
            history.append(
                {
                    "session_id": session_id,
                    "role": session.get("role", ""),
                    "level": session.get("level", ""),
                    "interview_type": session.get("interview_type", ""),
                    "skills": session.get("skills") or [],
                    "overall_score": overall,
                    "answered_count": len(answers),
                    "total_questions": len(session.get("questions") or []),
                    "created_at": session.get("created_at", ""),
                }
            )
        return history


service = InterviewAIService()
