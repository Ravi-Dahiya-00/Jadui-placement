# Agentic AI Career Coach

This folder is the main working project based on `project.txt`.

## Tech Stack
- Frontend: Next.js + React + Tailwind + shadcn/ui
- Backend: FastAPI (Python)
- AI Layer: LangChain + LangGraph + OpenAI/Gemini
- Data: Supabase (PostgreSQL, Auth, Storage)

## Folder Guide
- `frontend/` -> UI application
- `backend/` -> API and intelligence services
- `shared/` -> common schemas/contracts used across services
- `docs/` -> architecture and planning docs
- `scripts/` -> helper scripts (setup, migration, utilities)
- `module-dropzone/` -> place external module code here before integration

## Current Workflow
1. You drop module code into `module-dropzone/`.
2. We extract required parts and move to correct module folders in `backend/app/services/modules/`.
3. We wire APIs in `backend/app/api/` and frontend flows in `frontend/src/app/`.
