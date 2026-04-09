# PulseAI Interview Extraction (Frontend + Backend)

This document captures the final extraction scope from `PulseAI` into the Agentic project module.

## Extracted Backend Logic

- Question generation flow (role, level, tech stack, question count)
- Answer evaluation flow with structured scoring
- Feedback generation with actionable suggestions
- Result aggregation (correctness, clarity, relevance, overall)

## Extracted Frontend Logic

- Interview start form (role/skills/type/count)
- Question-by-question answer submission flow
- Per-answer evaluation display
- Final result summary card

## Mapped Module Paths

- Backend core module: `backend/modules/interview_ai/`
- Backend integration bridge: `backend/app/api/interview.py`
- Frontend module: `frontend/src/modules/interview_ai/`
- Frontend route integration: import `InterviewModule` from `frontend/src/modules/interview_ai/`

## PulseAI Sources Used

- `app/api/vapi/generate/route.ts`
- `lib/actions/general.action.ts`
- `Components/Agent.tsx`
- `app/(root)/interview/[id]/feedback/page.tsx`
- `types/index.d.ts`
