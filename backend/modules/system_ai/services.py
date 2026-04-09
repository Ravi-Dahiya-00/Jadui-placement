"""System state persistence service (tasks, roadmap, notifications)."""

from __future__ import annotations

from fastapi import HTTPException

from app.core.supabase_client import get_supabase_admin_client

DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


class SystemStateService:
    def _fallback_roadmap(self, skill_gaps: list[str]) -> list[dict]:
        base = skill_gaps or ["Problem-solving", "Communication", "System design basics"]
        return [
            {
                "day": day,
                "date": f"Day {idx + 1}",
                "status": "done" if idx < 2 else "active" if idx == 2 else "upcoming",
                "tasks": [
                    f"Practice {base[idx % len(base)]} for 60 minutes",
                    f"Solve 2 focused problems on {base[(idx + 1) % len(base)]}",
                    "Write one measurable improvement summary",
                ],
            }
            for idx, day in enumerate(DAY_LABELS)
        ]

    def _fallback_tasks(self, roadmap: list[dict]) -> list[dict]:
        due_map = ["Today", "Today", "Tomorrow", "Tomorrow", "This Week", "This Week", "This Week"]
        tasks: list[dict] = []
        for i, day in enumerate(roadmap):
            for j, task in enumerate(day.get("tasks", [])):
                tasks.append(
                    {
                        "id": f"{str(day.get('day', 'd')).lower()}-{j + 1}",
                        "title": task,
                        "category": "Core",
                        "completed": day.get("status") == "done",
                        "due": due_map[i] if i < len(due_map) else "This Week",
                    }
                )
        return tasks

    def get_state(self, user_id: str) -> dict:
        resp = (
            get_supabase_admin_client()
            .table("user_system_state")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            return {
                "user_id": user_id,
                "tasks": [],
                "roadmap": [],
                "notifications": [],
                "skill_gaps": [],
                "chat_context": {},
                "chat_history": [],
                "chat_sessions": [],
                "active_chat_session_id": "",
            }
        row = rows[0]
        return {
            "user_id": row.get("user_id"),
            "tasks": row.get("tasks") or [],
            "roadmap": row.get("roadmap") or [],
            "notifications": row.get("notifications") or [],
            "skill_gaps": row.get("skill_gaps") or [],
            "chat_context": row.get("chat_context") or {},
            "chat_history": row.get("chat_history") or [],
            "chat_sessions": row.get("chat_sessions") or [],
            "active_chat_session_id": row.get("active_chat_session_id") or "",
            "updated_at": row.get("updated_at"),
        }

    def save_state(
        self,
        user_id: str,
        tasks: list[dict],
        roadmap: list[dict],
        notifications: list[dict],
        skill_gaps: list[str],
        chat_context: dict,
        chat_history: list[dict] | None = None,
        chat_sessions: list[dict] | None = None,
        active_chat_session_id: str | None = None,
    ) -> dict:
        payload = {
            "user_id": user_id,
            "tasks": tasks or [],
            "roadmap": roadmap or [],
            "notifications": notifications or [],
            "skill_gaps": skill_gaps or [],
            "chat_context": chat_context or {},
            "chat_history": (chat_history if chat_history is not None else []),
            "chat_sessions": (chat_sessions if chat_sessions is not None else []),
            "active_chat_session_id": active_chat_session_id or "",
        }
        get_supabase_admin_client().table("user_system_state").upsert(payload, on_conflict="user_id").execute()
        return self.get_state(user_id)

    def mark_notification_read(self, user_id: str, notification_id: str) -> dict:
        state = self.get_state(user_id)
        notifications = state.get("notifications", [])
        changed = False
        for n in notifications:
            if str(n.get("id")) == str(notification_id):
                n["read"] = True
                changed = True
        if not changed:
            raise HTTPException(status_code=404, detail="notification not found")
        return self.save_state(
            user_id=user_id,
            tasks=state.get("tasks", []),
            roadmap=state.get("roadmap", []),
            notifications=notifications,
            skill_gaps=state.get("skill_gaps", []),
            chat_context=state.get("chat_context", {}),
            chat_history=state.get("chat_history", []),
            chat_sessions=state.get("chat_sessions", []),
            active_chat_session_id=state.get("active_chat_session_id", ""),
        )

    def regenerate_roadmap(self, user_id: str, skill_gaps: list[str] | None = None) -> dict:
        state = self.get_state(user_id)
        gaps = skill_gaps if skill_gaps is not None else (state.get("skill_gaps", []) or [])
        roadmap = self._fallback_roadmap(gaps)
        tasks = self._fallback_tasks(roadmap)
        notifications = state.get("notifications", [])
        notifications.insert(
            0,
            {
                "id": f"notif-roadmap-{len(notifications) + 1}",
                "title": "Roadmap regenerated",
                "body": "Your weekly roadmap and tasks were refreshed based on latest skill gaps.",
                "read": False,
            },
        )
        return self.save_state(
            user_id=user_id,
            tasks=tasks,
            roadmap=roadmap,
            notifications=notifications[:20],
            skill_gaps=gaps,
            chat_context=state.get("chat_context", {}),
            chat_history=state.get("chat_history", []),
            chat_sessions=state.get("chat_sessions", []),
            active_chat_session_id=state.get("active_chat_session_id", ""),
        )


service = SystemStateService()
