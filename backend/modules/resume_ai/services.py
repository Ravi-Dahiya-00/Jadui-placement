"""Service layer for resume upload, parsing, analysis, and result retrieval."""

from __future__ import annotations

import os

from fastapi import HTTPException, UploadFile

from app.core.supabase_client import get_supabase_admin_client
from .analyzer import analyzer
from .parser import parser
from .utils import (
    ResumeAnalysisRecord,
    ResumeFileRecord,
    extract_name_from_filename,
    new_id,
)


class ResumeAIService:
    def _insert_resume_result(self, payload: dict) -> None:
        supabase = get_supabase_admin_client()
        try:
            supabase.table("resume_results").insert(payload).execute()
        except Exception:
            # Backward-compatible fallback for DBs without new JSON columns.
            fallback_payload = {
                key: value
                for key, value in payload.items()
                if key
                not in {"section_reviews", "detailed_review", "analysis_version", "ai_provider"}
            }
            supabase.table("resume_results").insert(fallback_payload).execute()

    def _get_file_row(self, file_id: str) -> dict:
        resp = (
            get_supabase_admin_client()
            .table("resume_files")
            .select("*")
            .eq("id", file_id)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="resume file not found")
        return rows[0]

    async def upload_resume(self, file: UploadFile) -> ResumeFileRecord:
        if not file:
            raise HTTPException(status_code=400, detail="file is required")
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        parsed = parser.parse_bytes(file.filename or "resume.txt", file.content_type or "", data)
        if not parsed:
            raise HTTPException(status_code=400, detail="Could not extract text from resume")

        record = ResumeFileRecord(
            file_id=new_id(),
            filename=file.filename or "resume.txt",
            mime_type=file.content_type or "text/plain",
            candidate_name=extract_name_from_filename(file.filename or ""),
            text=parsed,
        )
        get_supabase_admin_client().table("resume_files").insert(
            {
                "id": record.file_id,
                "filename": record.filename,
                "mime_type": record.mime_type,
                "candidate_name": record.candidate_name,
                "parsed_text": record.text,
            }
        ).execute()
        return record

    def analyze_resume(
        self,
        file_id: str,
        role_target: str,
        target_skills: list[str],
        use_llm: bool = True,
    ) -> ResumeAnalysisRecord:
        file_record = self._get_file_row(file_id)

        analysis = analyzer.analyze(
            resume_text=file_record.get("parsed_text", ""),
            role_target=role_target,
            target_skills=target_skills,
            use_llm=use_llm,
        )
        result = ResumeAnalysisRecord(
            result_id=new_id(),
            file_id=file_id,
            role_target=role_target,
            skills=analysis["skills"],
            projects=analysis["projects"],
            experience_level=analysis["experience_level"],
            strengths=analysis["strengths"],
            weaknesses=analysis["weaknesses"],
            recommended_roles=analysis["recommended_roles"],
            skill_gap=analysis["skill_gap"],
            score=analysis["score"],
            section_reviews=analysis.get("section_reviews") or [],
            detailed_review=analysis.get("detailed_review") or {},
        )
        provider = os.getenv("AI_PROVIDER", "openai").strip().lower()
        self._insert_resume_result(
            {
                "id": result.result_id,
                "file_id": result.file_id,
                "role_target": result.role_target,
                "skills": result.skills,
                "projects": result.projects,
                "experience_level": result.experience_level,
                "strengths": result.strengths,
                "weaknesses": result.weaknesses,
                "recommended_roles": result.recommended_roles,
                "skill_gap": result.skill_gap,
                "score": result.score,
                "section_reviews": result.section_reviews,
                "detailed_review": result.detailed_review,
                "analysis_version": "v2",
                "ai_provider": provider if provider in {"openai", "gemini"} else "openai",
            }
        )
        return result

    def get_result(self, result_id: str) -> ResumeAnalysisRecord:
        resp = (
            get_supabase_admin_client()
            .table("resume_results")
            .select("*")
            .eq("id", result_id)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="result not found")
        row = rows[0]
        section_reviews: list[dict] = row.get("section_reviews") or []
        detailed_review: dict = row.get("detailed_review") or {}
        try:
            if not section_reviews or not detailed_review:
                file_row = self._get_file_row(row.get("file_id", ""))
                regenerated = analyzer.analyze(
                    resume_text=file_row.get("parsed_text", ""),
                    role_target=row.get("role_target", ""),
                    target_skills=row.get("skill_gap") or [],
                    use_llm=True,
                )
                section_reviews = regenerated.get("section_reviews") or []
                detailed_review = regenerated.get("detailed_review") or {}
        except Exception:
            section_reviews = []
            detailed_review = {}

        return ResumeAnalysisRecord(
            result_id=row["id"],
            file_id=row["file_id"],
            role_target=row.get("role_target", ""),
            skills=row.get("skills") or [],
            projects=row.get("projects") or [],
            experience_level=row.get("experience_level", "entry"),
            strengths=row.get("strengths") or [],
            weaknesses=row.get("weaknesses") or [],
            recommended_roles=row.get("recommended_roles") or [],
            skill_gap=row.get("skill_gap") or [],
            score=int(row.get("score", 0)),
            section_reviews=section_reviews,
            detailed_review=detailed_review,
            created_at=row.get("created_at", ""),
        )

    def get_history(self, limit: int = 10) -> list[dict]:
        limit = max(1, min(limit, 50))
        supabase = get_supabase_admin_client()
        try:
            resp = (
                supabase.table("resume_results")
                .select("id,file_id,role_target,experience_level,skills,skill_gap,score,created_at,analysis_version,ai_provider,detailed_review,resume_files(candidate_name,filename)")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
        except Exception:
            resp = (
                supabase.table("resume_results")
                .select("id,file_id,role_target,experience_level,score,created_at,resume_files(candidate_name,filename)")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
        rows = resp.data or []
        history: list[dict] = []
        for row in rows:
            file_meta = row.get("resume_files") or {}
            history.append(
                {
                    "result_id": row.get("id"),
                    "file_id": row.get("file_id"),
                    "candidate_name": file_meta.get("candidate_name", "Unknown Candidate"),
                    "filename": file_meta.get("filename", ""),
                    "role_target": row.get("role_target", ""),
                    "experience_level": row.get("experience_level", ""),
                    "skills": row.get("skills") or [],
                    "skill_gap": row.get("skill_gap") or [],
                    "score": int(row.get("score", 0)),
                    "ai_analyzed": bool(row.get("detailed_review")),
                    "analysis_version": row.get("analysis_version", "v1"),
                    "ai_provider": row.get("ai_provider", ""),
                    "created_at": row.get("created_at", ""),
                }
            )
        return history


service = ResumeAIService()
