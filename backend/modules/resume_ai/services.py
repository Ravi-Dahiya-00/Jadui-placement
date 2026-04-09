"""Service layer for resume upload, parsing, analysis, and result retrieval."""

from __future__ import annotations

from fastapi import HTTPException, UploadFile

from .analyzer import analyzer
from .parser import parser
from .utils import (
    ResumeAnalysisRecord,
    ResumeFileRecord,
    extract_name_from_filename,
    new_id,
    store,
)


class ResumeAIService:
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
        store.put_file(record)
        return record

    def analyze_resume(
        self,
        file_id: str,
        role_target: str,
        target_skills: list[str],
        use_llm: bool = True,
    ) -> ResumeAnalysisRecord:
        file_record = store.get_file(file_id)
        if not file_record:
            raise HTTPException(status_code=404, detail="resume file not found")

        analysis = analyzer.analyze(
            resume_text=file_record.text,
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
        store.put_result(result)
        return result

    def get_result(self, result_id: str) -> ResumeAnalysisRecord:
        result = store.get_result(result_id)
        if not result:
            raise HTTPException(status_code=404, detail="result not found")
        return result


service = ResumeAIService()
