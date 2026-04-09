"""Routes for persisting generated system state."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field, ConfigDict

from .services import service

router = APIRouter(tags=["system-ai"])


class TaskItem(BaseModel):
    id: str
    title: str
    category: str = "Core"
    completed: bool = False
    due: str = "This Week"


class RoadmapDay(BaseModel):
    day: str
    date: str
    status: str = "upcoming"
    tasks: list[str] = Field(default_factory=list)


class NotificationItem(BaseModel):
    id: str = ""
    title: str
    body: str
    read: bool = False


class ChatContextModel(BaseModel):
    model_config = ConfigDict(extra="allow")
    avgResumeScore: int = 0
    avgInterviewScore: int = 0
    topSkillGaps: list[str] = Field(default_factory=list)
    latestRoleTarget: str = ""
    targetRole: str = ""
    targetPlacementDate: str = ""


class SaveSystemStateRequest(BaseModel):
    user_id: str
    tasks: list[TaskItem] = Field(default_factory=list)
    roadmap: list[RoadmapDay] = Field(default_factory=list)
    notifications: list[NotificationItem] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    chat_context: ChatContextModel = Field(default_factory=ChatContextModel)
    chat_history: list[dict] = Field(default_factory=list)
    chat_sessions: list[dict] = Field(default_factory=list)
    active_chat_session_id: str = ""


class MarkNotificationReadRequest(BaseModel):
    user_id: str
    notification_id: str


class RegenerateRoadmapRequest(BaseModel):
    user_id: str
    skill_gaps: list[str] | None = None


@router.get("/system/state")
def get_system_state(user_id: str) -> dict:
    return {"state": service.get_state(user_id)}


@router.post("/system/state")
def save_system_state(payload: SaveSystemStateRequest) -> dict:
    return {
        "state": service.save_state(
            user_id=payload.user_id,
            tasks=[item.model_dump() for item in payload.tasks],
            roadmap=[item.model_dump() for item in payload.roadmap],
            notifications=[item.model_dump() for item in payload.notifications],
            skill_gaps=payload.skill_gaps,
            chat_context=payload.chat_context.model_dump(),
            chat_history=payload.chat_history,
            chat_sessions=payload.chat_sessions,
            active_chat_session_id=payload.active_chat_session_id,
        )
    }


@router.post("/system/notifications/read")
def mark_notification_read(payload: MarkNotificationReadRequest) -> dict:
    return {"state": service.mark_notification_read(payload.user_id, payload.notification_id)}


@router.post("/system/roadmap/regenerate")
def regenerate_roadmap(payload: RegenerateRoadmapRequest) -> dict:
    return {"state": service.regenerate_roadmap(payload.user_id, payload.skill_gaps)}
