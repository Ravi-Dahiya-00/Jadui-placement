"""Admin Routes: Exposing TPO analytics and student deep-dives."""

from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from .services import admin_service
from .assistant import assistant_service
from .workshops import workshop_service
from .security import verify_token, check_ip_block, record_failure
import os

router = APIRouter(tags=["admin-ai"])

class AdminLoginRequest(BaseModel):
    password: str

@router.post("/admin/auth/verify", dependencies=[Depends(check_ip_block)])
def verify_admin_auth(payload: AdminLoginRequest, request: Request):
    """Verifies the admin password and manages IP blocking."""
    expected = os.getenv("ADMIN_PANEL_PASSWORD")
    if not expected:
        raise HTTPException(status_code=500, detail="Admin security not configured.")
        
    if payload.password != expected:
        record_failure(request)
        raise HTTPException(status_code=401, detail="Invalid password.")
    
    return {"status": "success", "token": expected}

@router.get("/admin/workshops/suggestions", dependencies=[Depends(verify_token)])
async def get_workshop_suggestions():
    """AI scans all students' gaps and proposes workshops."""
    try:
        suggestions = await workshop_service.generate_suggestions()
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/workshops/schedule", dependencies=[Depends(verify_token)])
def schedule_workshop(payload: dict):
    """Confirm a suggested workshop and notify students."""
    try:
        saved = workshop_service.schedule_workshop(payload)
        return {"workshop": saved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AssistantChatRequest(BaseModel):
    query: str
    history: list[dict] = []

@router.post("/admin/students/{user_id}/shortlist", dependencies=[Depends(verify_token)])
def toggle_shortlist(user_id: str):
    """Flags/unflags a student for placement drives."""
    try:
        status = admin_service.toggle_shortlist(user_id)
        return {"is_shortlisted": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/students/{user_id}/notes", dependencies=[Depends(verify_token)])
def update_tpo_notes(user_id: str, payload: dict):
    """Saves private TPO feedback."""
    try:
        admin_service.update_tpo_notes(user_id, payload.get("notes", ""))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/assistant/chat", dependencies=[Depends(verify_token)])
async def chat_with_assistant(payload: AssistantChatRequest):
    """Interactive AI chat for the TPO based on batch data."""
    try:
        response = await assistant_service.generate_response(payload.query, payload.history)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# TODO: Add security dependency to check if user.role == 'admin'
# For now, we expose them for the ecosystem build phase.

@router.get("/admin/students/{id}/dossier", dependencies=[Depends(verify_token)])
def get_student_dossier(id: str):
    """Fetches a detailed hiring dossier for a specific student."""
    try:
        return {"dossier": admin_service.get_student_dossier(id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/simulate/hiring", dependencies=[Depends(verify_token)])
def simulate_hiring(q: str = ""):
    """Ranks students based on a job stack query."""
    try:
        return {"ranked": admin_service.rank_students_for_job(q)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class InterveneTaskRequest(BaseModel):
    user_id: str
    title: str

@router.post("/admin/intervene/task", dependencies=[Depends(verify_token)])
def assign_tpo_task(payload: InterveneTaskRequest):
    """Allows Admin to push a mandatory task to a student's dashboard."""
    try:
        return {"state": admin_service.assign_tpo_task(payload.user_id, payload.title)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/students", dependencies=[Depends(verify_token)])
def get_all_students():
    """Fetches the complete student roster for the TPO dashboard."""
    try:
        return {"students": admin_service.get_all_students()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/stats", dependencies=[Depends(verify_token)])
def get_admin_stats():
    """Provides aggregate metrics for the TPO command center."""
    try:
        return {"stats": admin_service.get_dashboard_stats()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
