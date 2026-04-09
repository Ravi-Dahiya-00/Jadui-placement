# HireLens Resume Extraction

This document captures reusable logic extracted from `HireLens` into `resume_ai`.

## Reused Core Logic

- Multi-format resume parsing pipeline from `lib/parseFile.ts`:
  - PDF parsing
  - DOCX parsing
  - TXT fallback
- Candidate name extraction from filename (best effort)
- Structured recruiter-style JSON analysis pattern from `lib/groq.ts`
- API pipeline design from `app/api/screen/route.ts`:
  - upload -> parse -> analyze -> structured result

## New Target Module

- `backend/modules/resume_ai/`
  - `__init__.py`
  - `routes.py`
  - `services.py`
  - `parser.py`
  - `analyzer.py`
  - `prompts.py`
  - `utils.py`

## API Endpoints

- `POST /resume/upload`
- `POST /resume/analyze`
- `GET /resume/result`

## Output Contract

```json
{
  "skills": [],
  "projects": [],
  "experience_level": "junior",
  "strengths": [],
  "weaknesses": [],
  "recommended_roles": [],
  "skill_gap": [],
  "score": 0
}
```
