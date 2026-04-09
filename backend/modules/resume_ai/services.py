"""Service layer for resume upload, parsing, analysis, and result retrieval."""

from __future__ import annotations

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
        )
        get_supabase_admin_client().table("resume_results").insert(
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
            }
        ).execute()
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
            created_at=row.get("created_at", ""),
        )

    def get_history(self, limit: int = 10) -> list[dict]:
        limit = max(1, min(limit, 50))
        resp = (
            get_supabase_admin_client()
            .table("resume_results")
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
                    "created_at": row.get("created_at", ""),
                }
            )
        return history


service = ResumeAIService()
