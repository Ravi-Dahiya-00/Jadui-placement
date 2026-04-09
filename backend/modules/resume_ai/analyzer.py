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
    _SECTION_KEYS = [
        "personal_summary",
        "technical_skills",
        "experience",
        "projects",
        "leadership_achievements",
    ]
    _BANNED_SOFT_PHRASES = (
        "great job",
        "looks amazing",
        "you are doing awesome",
        "you’re doing awesome",
        "good job",
        "excellent profile",
        "keep it up",
        "proud of you",
    )
    _SECTION_LABELS = {
        "personal_summary": "Personal Summary",
        "technical_skills": "Technical Skills",
        "experience": "Experience",
        "projects": "Projects",
        "leadership_achievements": "Leadership Achievements",
    }

    def _sanitize_tone_line(self, text: str) -> str:
        line = str(text or "").strip()
        low = line.lower()
        if any(phrase in low for phrase in self._BANNED_SOFT_PHRASES):
            return ""
        # Keep lines short and sharp.
        if len(line) > 220:
            line = line[:220].rstrip() + "."
        return line

    def _sanitize_review_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        cleaned = dict(payload or {})
        for key in ("issues", "justification", "tips"):
            vals = cleaned.get(key) or []
            sanitized = [self._sanitize_tone_line(v) for v in vals]
            cleaned[key] = [v for v in sanitized if v][:8]
        cleaned["improved_block"] = self._sanitize_tone_line(cleaned.get("improved_block", ""))
        return cleaned

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

    def _extract_all_sections(self, resume_text: str) -> dict[str, str]:
        sections = {
            "personal_summary": self._extract_section(
                resume_text,
                [r"^personal details", r"^contact", r"^professional summary", r"^summary", r"^profile"],
            ),
            "technical_skills": self._extract_section(resume_text, [r"^technical skills", r"^skills", r"^tech stack"]),
            "experience": self._extract_section(resume_text, [r"^experience", r"^work experience", r"^employment"]),
            "projects": self._extract_section(resume_text, [r"^projects", r"^project"]),
            "leadership_achievements": self._extract_section(
                resume_text,
                [r"^leadership", r"^achievements", r"^leadership\s*&\s*achievements", r"^positions of responsibility"],
            ),
        }
        for key, value in list(sections.items()):
            if value:
                continue
            sections[key] = self._infer_section_without_heading(resume_text, key)
        return sections

    def _infer_section_without_heading(self, resume_text: str, section: str) -> str:
        lines = [ln.strip() for ln in (resume_text or "").splitlines() if ln.strip()]
        low_lines = [ln.lower() for ln in lines]
        if not lines:
            return ""

        if section == "personal_summary":
            # Use top block before clear experience/project timeline markers.
            stop_words = ("experience", "work experience", "projects", "skills", "education")
            block: list[str] = []
            for line in lines[:18]:
                if any(sw in line.lower() for sw in stop_words):
                    break
                block.append(line)
            return normalize_space("\n".join(block[:6]))

        if section == "technical_skills":
            skill_lines = [
                lines[i]
                for i, low in enumerate(low_lines)
                if "," in low and sum(1 for s in COMMON_SKILLS if s in low) >= 2
            ]
            return normalize_space("\n".join(skill_lines[:4]))

        if section == "experience":
            exp_tokens = ("intern", "developer", "engineer", "company", "present", "month", "year")
            exp_lines = [lines[i] for i, low in enumerate(low_lines) if any(t in low for t in exp_tokens)]
            return normalize_space("\n".join(exp_lines[:8]))

        if section == "projects":
            proj_tokens = ("project", "built", "developed", "implemented", "deployed", "github")
            proj_lines = [lines[i] for i, low in enumerate(low_lines) if any(t in low for t in proj_tokens)]
            return normalize_space("\n".join(proj_lines[:8]))

        if section == "leadership_achievements":
            leader_tokens = ("lead", "mentored", "organized", "hackathon", "winner", "achievement", "community")
            leader_lines = [lines[i] for i, low in enumerate(low_lines) if any(t in low for t in leader_tokens)]
            return normalize_space("\n".join(leader_lines[:6]))

        return ""

    def _deterministic_section_review(self, section: str, section_text: str, full_text: str) -> dict[str, Any]:
        text = (section_text or "").strip()
        full = (full_text or "").lower()
        low = text.lower()
        issues: list[str] = []
        tips: list[str] = []
        improved_block = ""
        extracted_skills: list[str] = []
        inferred_role = ""
        exp_level = self.infer_experience_level(full_text)
        confidence = 88

        if section == "personal_summary":
            if not text:
                issues.append("Personal details/professional summary section is missing.")
                confidence -= 35
            if "linkedin.com" not in full:
                issues.append("LinkedIn URL missing in contact header.")
                confidence -= 8
            if "github.com" not in full:
                issues.append("GitHub URL missing in contact header.")
                confidence -= 8
            weak_words = [w for w in ("passionate", "hardworking", "enthusiastic") if w in low]
            if weak_words:
                issues.append("Summary uses weak claims: " + ", ".join(weak_words))
                confidence -= 12
            tips = [
                "Keep summary to 2-3 lines with role-first positioning.",
                "Add clickable LinkedIn and GitHub links in one clean line.",
                "Replace generic adjectives with backend/API strengths.",
            ]
            improved_block = (
                "Full Stack Developer focused on backend APIs, scalable web systems, and SQL-driven applications. "
                "Builds production-grade features across React/Next.js and Python/Node backends with measurable delivery outcomes."
            )

        elif section == "technical_skills":
            extracted_skills = self.extract_skills(text or full_text)
            if not text:
                issues.append("Technical Skills section is missing.")
                confidence -= 30
            if len(extracted_skills) < 5:
                issues.append("Skill depth appears limited for software engineering screening.")
                confidence -= 14
            if len(extracted_skills) > 16:
                issues.append("Skill list is overloaded and may reduce credibility.")
                confidence -= 10
            tips = [
                "Group skills by Languages, Frontend, Backend, Databases, Tools.",
                "Remove technologies you cannot defend in interviews.",
                "Keep stack aligned to target role requirements.",
            ]
            improved_block = (
                "Languages: JavaScript, TypeScript, Python, SQL | "
                "Frontend: React, Next.js | Backend: Node.js, FastAPI | "
                "Databases: PostgreSQL, MySQL, MongoDB | Tools: Git, Docker"
            )

        elif section == "experience":
            if not text:
                issues.append("Experience section is missing.")
                confidence -= 35
            weak_hits = [p for p in ("worked on", "helped with", "responsible for", "collaborated") if p in low]
            if weak_hits:
                issues.append("Experience bullets use weak phrasing: " + ", ".join(weak_hits[:3]))
                confidence -= 12
            if not re.search(r"\d+%|\d+\s*(ms|sec|users|requests|x)", low):
                issues.append("Experience bullets lack measurable impact signals.")
                confidence -= 10
            tips = [
                "Rewrite bullets in Problem -> Action -> Result format.",
                "Start each bullet with strong engineering verbs.",
                "Add measurable impact only where factual and defensible.",
            ]
            improved_block = (
                "- Reduced API response latency by optimizing query paths and caching critical endpoints.\n"
                "- Built and deployed backend services for auth, data validation, and analytics workflows."
            )

        elif section == "projects":
            if not text:
                issues.append("Projects section is missing.")
                confidence -= 35
            if "api" not in low:
                issues.append("Project write-up lacks explicit API/backend implementation details.")
                confidence -= 12
            if all(k not in low for k in ("postgres", "mysql", "mongodb", "database")):
                issues.append("Database design/usage is not clearly mentioned.")
                confidence -= 10
            tips = [
                "Lead with strongest technically deep project first.",
                "State architecture choices: API, DB, auth, caching, deployment.",
                "Describe how features were built, not just what they do.",
            ]
            improved_block = (
                "- Designed REST APIs with role-based auth and PostgreSQL schema for core workflows.\n"
                "- Implemented backend validation and async processing to improve reliability under load."
            )

        elif section == "leadership_achievements":
            if not text:
                issues.append("Leadership & Achievements section is missing.")
                confidence -= 25
            if len(text.split()) < 20:
                issues.append("Leadership section is too thin to influence shortlist decisions.")
                confidence -= 8
            if any(k in low for k in ("helped others", "shared knowledge")):
                issues.append("Leadership claims are generic and not tied to scale or impact.")
                confidence -= 12
            tips = [
                "Keep only verifiable achievements with clear impact.",
                "Prioritize technical leadership over generic statements.",
                "Put strongest achievement first with scale/context.",
            ]
            improved_block = (
                "- Led technical delivery for multi-feature release with clear ownership boundaries.\n"
                "- Drove measurable process improvement through code quality and review standards."
            )

        bs_factor = min(10, max(2, 3 + len(issues)))
        return self._sanitize_review_payload(
            {
                "section": section,
                "bs_factor": bs_factor,
                "issues": issues or [f"{self._SECTION_LABELS.get(section, section)} needs stronger technical clarity."],
                "improved_block": improved_block,
                "justification": [f"Focused on recruiter signal quality for {self._SECTION_LABELS.get(section, section)}."],
                "tips": tips,
                "extracted_skills": extracted_skills[:15],
                "inferred_role": inferred_role,
                "experience_level": exp_level,
                "confidence": max(20, min(95, confidence)),
            }
        )

    def _fallback_section_reviews(self, text: str) -> list[dict[str, Any]]:
        sections = self._extract_all_sections(text)
        reviews = [
            self._deterministic_section_review(section, sections.get(section, ""), text)
            for section in self._SECTION_KEYS
        ]
        return reviews

    def _build_detailed_review(
        self,
        section_reviews: list[dict[str, Any]],
        overall_score_100: int,
    ) -> dict[str, Any]:
        section_map = {str(s.get("section", "")).strip(): s for s in section_reviews}
        ordered = [section_map.get(k, {"section": k, "bs_factor": 6, "issues": [], "improved_block": "", "justification": [], "tips": []}) for k in self._SECTION_KEYS]
        all_issues: list[str] = []
        all_justifications: list[str] = []
        all_tips: list[str] = []
        bs_factors: dict[str, int] = {}
        rewritten_sections: list[dict[str, str]] = []

        for section in ordered:
            section = self._sanitize_review_payload(section)
            key = str(section.get("section", "unknown"))
            label = key.replace("_", " ").title()
            try:
                bs_value = int(section.get("bs_factor", 6))
            except Exception:
                bs_value = 6
            bs_factors[label] = max(1, min(10, bs_value))
            all_issues.extend([str(i) for i in (section.get("issues") or []) if str(i).strip()])
            all_justifications.extend([str(i) for i in (section.get("justification") or []) if str(i).strip()])
            all_tips.extend([str(i) for i in (section.get("tips") or []) if str(i).strip()])
            improved = str(section.get("improved_block", "")).strip()
            if improved:
                rewritten_sections.append({"section": label, "content": improved})

        unique_issues = [self._sanitize_tone_line(i) for i in list(dict.fromkeys(all_issues))[:10]]
        unique_issues = [i for i in unique_issues if i]
        unique_justifications = [self._sanitize_tone_line(i) for i in list(dict.fromkeys(all_justifications))[:6]]
        unique_justifications = [i for i in unique_justifications if i]
        unique_tips = [self._sanitize_tone_line(i) for i in list(dict.fromkeys(all_tips))[:4]]
        unique_tips = [i for i in unique_tips if i]
        overall_score_10 = round(max(1.0, min(10.0, overall_score_100 / 10.0)), 1)
        avg_bs = sum(bs_factors.values()) / max(1, len(bs_factors))
        if overall_score_10 >= 7.5:
            competitive = "Above average profile for startups; needs sharper impact language for top-tier screening."
        elif overall_score_10 >= 6:
            competitive = "Average profile in current pool; credible but not differentiated enough for strong shortlist conversion."
        else:
            competitive = "Below competitive threshold right now; weak positioning and section depth will hurt shortlist chances."

        return {
            "brutal_assessment": {
                "overall_score_out_of_10": overall_score_10,
                "section_wise_bs_factor": bs_factors,
                "clear_flaws": unique_issues,
            },
            "optimized_output": rewritten_sections,
            "justification": unique_justifications or [
                "Weak phrasing reduced clarity.",
                "Technical impact was not visible enough for recruiter scan speed.",
                "Sections were rewritten for ATS readability and credibility.",
            ],
            "competitive_insight": competitive + f" Current BS intensity: {avg_bs:.1f}/10.",
            "actionable_next_steps": unique_tips or [
                "Rewrite summary with role + backend/API depth in 2-3 lines.",
                "Convert experience bullets to measurable impact.",
                "Reorder projects by technical depth and interview defensibility.",
            ],
        }

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
        sections = self._extract_all_sections(resume_text)

        prompts: list[tuple[str, str]] = [
            ("personal_summary", personal_summary_review_prompt(sections.get("personal_summary") or resume_text[:2000])),
            ("technical_skills", technical_skills_review_prompt(sections.get("technical_skills") or resume_text[:2000])),
            ("experience", experience_review_prompt(sections.get("experience") or resume_text[:2500])),
            ("projects", projects_review_prompt(sections.get("projects") or resume_text[:2500])),
            ("leadership_achievements", leadership_review_prompt(sections.get("leadership_achievements") or resume_text[:1500])),
        ]

        reviews: list[dict[str, Any]] = []
        for section_key, prompt in prompts:
            try:
                data = self._llm_json(prompt)
                if isinstance(data, dict):
                    data["section"] = section_key
                    data["confidence"] = int(data.get("confidence", 78) or 78)
                    reviews.append(self._sanitize_review_payload(data))
                else:
                    reviews.append(self._deterministic_section_review(section_key, sections.get(section_key, ""), resume_text))
            except Exception:
                reviews.append(self._deterministic_section_review(section_key, sections.get(section_key, ""), resume_text))
        return reviews

    def analyze(
        self,
        resume_text: str,
        role_target: str,
        target_skills: list[str],
        use_llm: bool = True,
    ) -> dict[str, Any]:
        raw_resume_text = resume_text or ""
        cleaned = normalize_space(raw_resume_text)
        cleanup_payload: dict[str, Any] = {}
        cleaned_for_analysis = raw_resume_text
        llm_skills_hint: list[str] = []
        llm_projects_hint: list[str] = []
        llm_experience_years = 0

        if use_llm:
            try:
                cleanup_payload = self._llm_cleanup_resume(cleaned[:12000])
                cleaned_for_analysis = str(
                    str(cleanup_payload.get("normalized_text", cleaned))
                ) or raw_resume_text
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
                cleaned_for_analysis = raw_resume_text

        deterministic_skills = self.extract_skills(normalize_space(cleaned_for_analysis))
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
            exp = self.infer_experience_level(normalize_space(cleaned_for_analysis))
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
        deterministic["detailed_review"] = self._build_detailed_review(
            deterministic["section_reviews"], deterministic["score"]
        )

        if not use_llm:
            return deterministic

        try:
            semantic = self._llm_semantic_analysis(normalize_space(cleaned_for_analysis)[:12000], role_target, target_skills)
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

            response = {
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
            response["detailed_review"] = self._build_detailed_review(response["section_reviews"], response["score"])
            return response
        except Exception:
            return deterministic


analyzer = ResumeAnalyzer()
