"""Backend application entrypoint."""

from fastapi import FastAPI

from backend.modules.interview_ai.routes import router as interview_router
from backend.modules.resume_ai.routes import router as resume_router

app = FastAPI(title="Agentic AI Career Coach Backend")
app.include_router(interview_router)
app.include_router(resume_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
