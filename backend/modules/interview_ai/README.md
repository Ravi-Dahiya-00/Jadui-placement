# AI Interview Module

Standalone module extracted/refactored from interview-specific PulseAI flows.

## Endpoints
- `POST /interview/start`
- `POST /interview/answer`
- `GET /interview/result?session_id=<id>`

## Environment
- `AI_PROVIDER=openai` or `gemini`
- For OpenAI:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (optional, default `gpt-4o-mini`)
- For Gemini:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL` (optional, default `gemini-1.5-flash`)

## FastAPI Integration
```python
from fastapi import FastAPI
from backend.modules.interview_ai import router as interview_router

app = FastAPI()
app.include_router(interview_router)
```
