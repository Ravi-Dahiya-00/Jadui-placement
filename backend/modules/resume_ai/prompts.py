"""LLM prompt templates for semantic resume intelligence."""

from __future__ import annotations


def resume_cleanup_prompt(raw_text: str) -> str:
    return f"""
You are a resume text normalizer.
Convert noisy resume text into structured JSON with concise normalized text.

Rules:
- Keep factual information only from the input
- Do not hallucinate new projects or skills
- Deduplicate repeated lines
- Remove gibberish and broken symbols where possible

Raw text:
{raw_text}

Return STRICT JSON only:
{{
  "normalized_text": "cleaned resume text",
  "skills": ["..."],
  "projects": ["..."],
  "experience_years": 0
}}
"""


def semantic_resume_analysis_prompt(
    resume_text: str,
    target_role: str,
    target_skills: list[str],
) -> str:
    skills = ", ".join(target_skills) if target_skills else "Not specified"
    return f"""
You are an expert recruiter and career coach.
Analyze the resume semantically for role fit.

Target role: {target_role}
Target skills: {skills}

Resume text:
{resume_text}

Return STRICT JSON only:
{{
  "experience_level": "entry|junior|mid|senior|lead",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommended_roles": ["..."],
  "skill_gap": ["..."],
  "score": 0
}}

Scoring rubric:
- 0-49: weak fit
- 50-74: moderate fit
- 75-100: strong fit
"""


def _json_contract(section_name: str) -> str:
    return f"""
Return STRICT JSON only with this exact shape:
{{
  "section": "{section_name}",
  "bs_factor": 1,
  "issues": ["..."],
  "improved_block": "...",
  "justification": ["..."],
  "tips": ["..."],
  "extracted_skills": ["..."],
  "inferred_role": "",
  "experience_level": "entry|junior|mid|senior|lead"
}}

Style constraints for every field:
- Be direct, strict, and recruiter-focused.
- No motivational or emotional language.
- No praise like "great job", "awesome", "excellent profile".
- Use short, concrete, technical statements.
"""


def personal_summary_review_prompt(section_text: str) -> str:
    return f"""
You are a senior hiring manager and resume strategist with 20+ years of experience reviewing high-impact technical resumes.

Your task is to analyze and improve ONLY the following sections of my resume:
1. Personal Details (Name, Email, Phone, LinkedIn, GitHub)
2. Professional Summary

STRICT RULES:
- Do NOT modify any other section.
- Do NOT add fake information or exaggerate.
- Keep everything ATS-friendly and clean.
- Keep summary concise (2-3 lines max).
- Maintain a strong, confident, technical tone (no fluff).

ANALYSIS REQUIREMENTS:
- Validate formatting/professionalism/clickability in personal details.
- Evaluate role clarity, technical positioning, weak wording, and first impression quality in summary.

{_json_contract("personal_summary")}

INPUT:
{section_text}
"""


def technical_skills_review_prompt(section_text: str) -> str:
    return f"""
You are a senior software engineering hiring manager and resume optimization expert.
Analyze and improve ONLY the "Technical Skills" section.

STRICT RULES:
- Do NOT modify any other section.
- Do NOT add skills not present in input.
- Remove redundancy/overclaiming/low-value skills.
- Keep structure ATS-friendly and aligned for Full Stack Developer / Software Engineer roles.

ANALYSIS REQUIREMENTS:
- Evaluate relevance, overclaiming risk, grouping quality, and missing expected skills based on provided text.

{_json_contract("technical_skills")}

INPUT:
{section_text}
"""


def experience_review_prompt(section_text: str) -> str:
    return f"""
You are a senior engineering hiring manager with 20+ years of experience.
Analyze and improve ONLY the "Experience" section.

STRICT RULES:
- Do NOT modify any other section.
- Do NOT add fake metrics.
- Rewrite weak bullets into concise, results-driven statements.
- Prefer active voice and technical depth.

ANALYSIS REQUIREMENTS:
- Flag weak wording, missing impact, missing backend/system depth.
- Prefer PAR style (Problem -> Action -> Result) where possible.

{_json_contract("experience")}

INPUT:
{section_text}
"""


def projects_review_prompt(section_text: str) -> str:
    return f"""
You are a senior software engineering hiring manager and system design interviewer.
Analyze and improve ONLY the "Projects" section.

STRICT RULES:
- Do NOT modify any other section.
- Do NOT add fake metrics.
- Avoid unsupported buzzwords.
- Emphasize real engineering depth (APIs, DB, auth, performance, architecture).

ANALYSIS REQUIREMENTS:
- Detect generic feature-listing, weak technical depth, missing backend/system thinking.
- Prefer concise bullets with strong technical clarity.

{_json_contract("projects")}

INPUT:
{section_text}
"""


def leadership_review_prompt(section_text: str) -> str:
    return f"""
You are a senior hiring manager with 20+ years of experience evaluating software engineering candidates.
Analyze and improve ONLY the "Leadership & Achievements" section.

STRICT RULES:
- Do NOT modify any other section.
- Do NOT add fake achievements or inflate numbers.
- Remove fluff and keep content concise and credible.

ANALYSIS REQUIREMENTS:
- Evaluate impact, specificity, verifiability, and technical relevance.
- Prioritize high-impact technical achievements.

{_json_contract("leadership_achievements")}

INPUT:
{section_text}
"""
