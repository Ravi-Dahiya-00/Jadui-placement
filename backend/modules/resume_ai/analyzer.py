"""Deterministic analysis + optional LLM enhancement for resume intelligence."""

from __future__ import annotations

import os
import re
from typing import Any

from fastapi import HTTPException

from .prompts import (
    experience_review_prompt,
    leadership_review_prompt,
    personal_summary_review_prompt,
    projects_review_prompt,
    resume_cleanup_prompt,
    semantic_resume_analysis_prompt,
    technical_skills_review_prompt,
)
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
    def _deterministic_quality_audit(self, text: str) -> dict[str, Any]:
        norm = text.lower()
        issues: list[str] = []
        tips: list[str] = []

        if "linkedin.com" not in norm:
            issues.append("LinkedIn URL missing from personal details.")
            tips.append("Add a clickable LinkedIn URL in the header.")
        if "github.com" not in norm:
            issues.append("GitHub URL missing from personal details.")
            tips.append("Add a clickable GitHub profile URL.")
        if "summary" not in norm and "professional summary" not in norm:
            issues.append("Professional summary section is missing or unclear.")
            tips.append("Add a 2-3 line summary with target role and backend strengths.")

        weak_phrases = ["passionate", "hardworking", "worked on", "helped with", "responsible for"]
        weak_hits = [phrase for phrase in weak_phrases if phrase in norm]
        if weak_hits:
            issues.append("Generic/weak phrasing detected: " + ", ".join(weak_hits[:3]))
            tips.append("Replace generic phrases with action + technical impact statements.")

        section_keywords = ["skills", "experience", "projects"]
        missing_sections = [sec for sec in section_keywords if sec not in norm]
        if missing_sections:
            issues.append("Important sections appear missing: " + ", ".join(missing_sections))
            tips.append("Ensure Skills, Experience, and Projects headings are clearly present.")

        if len(text.split()) < 120:
            issues.append("Resume content appears too short for a competitive technical profile.")
            tips.append("Add stronger project depth, APIs/system design contributions, and measurable outcomes.")

        # Conservative score model that avoids unrealistically perfect scores.
        score = 88 - (len(issues) * 7)
        score = max(40, min(88, score))
        return {"issues": issues, "tips": tips[:3], "score": score}

    def _fallback_section_reviews(self, text: str) -> list[dict[str, Any]]:
        audit = self._deterministic_quality_audit(text)
        return [
            {
                "section": "overall_resume",
                "bs_factor": min(10, max(1, len(audit["issues"]) + 2)),
                "issues": audit["issues"][:6],
                "improved_block": "Rewrite summary using role-first positioning, include backend/API strengths, and remove generic claims.",
                "justification": ["Generated from deterministic audit because section-wise LLM review is unavailable."],
                "tips": audit["tips"],
                "extracted_skills": [],
                "inferred_role": "",
                "experience_level": "entry",
            }
        ]

    def _extract_section(self, text: str, heading_patterns: list[str]) -> str:
        lines = text.splitlines()
        if not lines:
            return ""
        starts: list[int] = []
        for idx, line in enumerate(lines):
            low = line.strip().lower()
            if any(re.search(pat, low) for pat in heading_patterns):
                starts.append(idx)
        if not starts:
            return ""
        start = starts[0] + 1
        end = len(lines)
        heading_any = re.compile(
            r"^\s*(summary|professional summary|skills|technical skills|experience|work experience|projects|project|leadership|achievements|education|certifications?)\s*:?\s*$",
            re.IGNORECASE,
        )
        for idx in range(start, len(lines)):
            if heading_any.search(lines[idx].strip()):
                end = idx
                break
        return normalize_space("\n".join(lines[start:end]).strip())

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

    def _llm_json(self, prompt: str) -> dict[str, Any]:
        provider = os.getenv("AI_PROVIDER", "openai").lower()

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

    def _llm_cleanup_resume(self, raw_resume_text: str) -> dict[str, Any]:
        prompt = resume_cleanup_prompt(raw_resume_text)
        return self._llm_json(prompt)

    def _llm_semantic_analysis(self, resume_text: str, role_target: str, target_skills: list[str]) -> dict[str, Any]:
        prompt = semantic_resume_analysis_prompt(resume_text, role_target, target_skills)
        return self._llm_json(prompt)

    def _llm_section_reviews(self, resume_text: str) -> list[dict[str, Any]]:
        personal_summary = self._extract_section(
            resume_text,
            [r"^personal details", r"^contact", r"^professional summary", r"^summary"],
        )
        technical_skills = self._extract_section(resume_text, [r"^technical skills", r"^skills"])
        experience = self._extract_section(resume_text, [r"^experience", r"^work experience"])
        projects = self._extract_section(resume_text, [r"^projects", r"^project"])
        leadership = self._extract_section(
            resume_text,
            [r"^leadership", r"^achievements", r"^leadership\s*&\s*achievements"],
        )

        prompts: list[tuple[str, str]] = [
            ("personal_summary", personal_summary_review_prompt(personal_summary or resume_text[:2000])),
            ("technical_skills", technical_skills_review_prompt(technical_skills or resume_text[:2000])),
            ("experience", experience_review_prompt(experience or resume_text[:2500])),
            ("projects", projects_review_prompt(projects or resume_text[:2500])),
            ("leadership_achievements", leadership_review_prompt(leadership or resume_text[:1500])),
        ]

        reviews: list[dict[str, Any]] = []
        for _, prompt in prompts:
            try:
                data = self._llm_json(prompt)
                if isinstance(data, dict):
                    reviews.append(data)
            except Exception:
                continue
        return reviews

    def analyze(
        self,
        resume_text: str,
        role_target: str,
        target_skills: list[str],
        use_llm: bool = True,
    ) -> dict[str, Any]:
        cleaned = normalize_space(resume_text)
        cleanup_payload: dict[str, Any] = {}
        cleaned_for_analysis = cleaned
        llm_skills_hint: list[str] = []
        llm_projects_hint: list[str] = []
        llm_experience_years = 0

        if use_llm:
            try:
                cleanup_payload = self._llm_cleanup_resume(cleaned[:12000])
                cleaned_for_analysis = normalize_space(
                    str(cleanup_payload.get("normalized_text", cleaned))
                ) or cleaned
                llm_skills_hint = [
                    str(item).strip().lower()
                    for item in (cleanup_payload.get("skills") or [])
                    if str(item).strip()
                ]
                llm_projects_hint = [
                    str(item).strip()
                    for item in (cleanup_payload.get("projects") or [])
                    if str(item).strip()
                ]
                llm_experience_years = int(cleanup_payload.get("experience_years", 0) or 0)
            except Exception:
                cleaned_for_analysis = cleaned

        deterministic_skills = self.extract_skills(cleaned_for_analysis)
        skills = sorted(set(deterministic_skills + llm_skills_hint))
        projects = (self.extract_projects(cleaned_for_analysis) + llm_projects_hint)[:5]
        if llm_experience_years > 0:
            exp = (
                "lead"
                if llm_experience_years >= 10
                else "senior"
                if llm_experience_years >= 6
                else "mid"
                if llm_experience_years >= 3
                else "junior"
            )
        else:
            exp = self.infer_experience_level(cleaned_for_analysis)
        gap = self.compute_skill_gap(skills, target_skills)
        quality_audit = self._deterministic_quality_audit(cleaned_for_analysis)
        deterministic_base_score = quality_audit["score"] - (len(gap) * 5)
        deterministic_base_score = max(35, min(90, deterministic_base_score))

        deterministic = {
            "skills": skills,
            "projects": projects,
            "experience_level": exp,
            "strengths": [
                "Demonstrates relevant technical stack exposure." if skills else "Resume structure is present.",
                "Project descriptions show implementation context." if projects else "Profile provides baseline information.",
            ],
            "weaknesses": (
                (["Missing target skills: " + ", ".join(gap)] if gap else [])
                + quality_audit["issues"][:3]
            )[:5],
            "recommended_roles": [role_target] if role_target else ["Software Engineer"],
            "skill_gap": gap,
            "score": deterministic_base_score,
            "section_reviews": self._fallback_section_reviews(cleaned_for_analysis),
        }

        if not use_llm:
            return deterministic

        try:
            semantic = self._llm_semantic_analysis(cleaned_for_analysis[:12000], role_target, target_skills)
            section_reviews = self._llm_section_reviews(cleaned_for_analysis[:12000]) or self._fallback_section_reviews(
                cleaned_for_analysis
            )

            issues: list[str] = []
            tips: list[str] = []
            inferred_roles: list[str] = []
            section_skills: list[str] = []
            bs_factors: list[int] = []
            for review in section_reviews:
                issues.extend([str(i) for i in (review.get("issues") or []) if str(i).strip()])
                tips.extend([str(i) for i in (review.get("tips") or []) if str(i).strip()])
                section_skills.extend([str(i).strip().lower() for i in (review.get("extracted_skills") or []) if str(i).strip()])
                role = str(review.get("inferred_role", "")).strip()
                if role:
                    inferred_roles.append(role)
                try:
                    bs = int(review.get("bs_factor", 0))
                    if 1 <= bs <= 10:
                        bs_factors.append(bs)
                except Exception:
                    pass

            merged_skills = sorted(set(skills + section_skills))
            merged_gap = self.compute_skill_gap(merged_skills, target_skills)
            avg_bs = (sum(bs_factors) / len(bs_factors)) if bs_factors else 5.0
            issue_penalty = min(len(issues), 12) * 2
            gap_penalty = min(len(merged_gap), 10) * 5
            bs_penalty = int(avg_bs * 4)
            computed_score = max(35, min(95, deterministic_base_score - issue_penalty - gap_penalty - bs_penalty + 12))

            llm_score_raw = semantic.get("score", computed_score)
            try:
                llm_score = int(llm_score_raw)
            except Exception:
                llm_score = computed_score
            final_score = max(35, min(95, int((computed_score * 0.6) + (llm_score * 0.4))))

            return {
                "skills": merged_skills,
                "projects": projects,
                "experience_level": semantic.get("experience_level", deterministic["experience_level"]),
                "strengths": semantic.get("strengths", deterministic["strengths"])[:3],
                "weaknesses": (semantic.get("weaknesses", []) or issues or deterministic["weaknesses"])[:5],
                "recommended_roles": (
                    semantic.get("recommended_roles", [])
                    or inferred_roles
                    or deterministic["recommended_roles"]
                )[:5],
                "skill_gap": (semantic.get("skill_gap", []) or merged_gap)[:10],
                "score": final_score,
                "section_reviews": section_reviews[:5],
            }
        except Exception:
            return deterministic


analyzer = ResumeAnalyzer()
