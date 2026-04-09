"""Backend application entrypoint."""

from fastapi import FastAPI

from modules.github_profile.routes import router as github_profile_router
from modules.interview_ai.routes import router as interview_router
from modules.mentor_ai.routes import router as mentor_router
from modules.resume_ai.routes import router as resume_router
from modules.system_ai.routes import router as system_router

app = FastAPI(title="Agentic AI Career Coach Backend")
app.include_router(github_profile_router)
app.include_router(interview_router)
app.include_router(mentor_router)
app.include_router(resume_router)
app.include_router(system_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
