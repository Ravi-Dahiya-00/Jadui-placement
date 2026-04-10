"""Backend application entrypoint."""

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Agentic AI Career Coach Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://jadui-placement.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173", # Vite default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router, prefix="/api")
app.include_router(github_profile_router, prefix="/api")
app.include_router(github_review_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(mentor_router, prefix="/api")
app.include_router(resume_router, prefix="/api")
app.include_router(system_router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
