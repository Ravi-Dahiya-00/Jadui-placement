"""Workshop Service: AI-driven clustering and scheduling of batch training."""

from __future__ import annotations
import json
from typing import Any
from app.core.config import settings
from app.core.supabase_client import get_supabase_admin_client

class WorkshopService:
    async def generate_suggestions(self) -> list[dict[str, Any]]:
        """Scans student records to find clusters of shared skill gaps."""
        # 1. Fetch all system states
        states = (
            get_supabase_admin_client()
            .table("user_system_state")
            .select("user_id, skill_gaps")
            .execute()
        ).data or []
        
        # 2. Group User IDs by skill gap
        skill_groups: dict[str, list[str]] = {}
        for s in states:
            uid = s['user_id']
            for gap in s.get("skill_gaps", []):
                if gap not in skill_groups:
                    skill_groups[gap] = []
                skill_groups[gap].append(uid)
                
        # 3. Filter for significant groups (e.g., more than 3 students)
        significant_groups = {k: v for k, v in skill_groups.items() if len(v) >= 2}
        
        # 4. Use AI to plan a curriculum for each group
        suggestions = []
        for skill, uids in significant_groups.items():
            suggestion = await self._plan_with_ai(skill, len(uids))
            suggestion["student_ids"] = uids
            suggestions.append(suggestion)
            
        return suggestions

    async def _plan_with_ai(self, skill: str, student_count: int) -> dict[str, Any]:
        """Uses AI to generate a title, description, and curriculum for a skill cluster."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            
            prompt = f"""
            Generate a training workshop plan for a group of {student_count} students who are struggling with "{skill}".
            
            Return a valid JSON object:
            {{
                "title": "A catchy, elite-sounding workshop title (e.g. {skill} Deep Dive)",
                "description": "A 1-sentence motivation for the students",
                "skill_target": "{skill}",
                "curriculum": ["Topic 1", "Topic 2", "Topic 3"]
            }}
            """
            
            response = await model.generate_content_async(prompt)
            raw = response.text.strip()
            if "```json" in raw: raw = raw.split("```json")[1].split("```")[0].strip()
            return json.loads(raw)
        except Exception:
            return {
                "title": f"{skill} Mastery Workshop",
                "description": f"Refining {skill} fundamentals for the upcoming placement drive.",
                "skill_target": skill,
                "curriculum": ["Fundamentals", "Advanced Patterns", "Project Implementation"]
            }

    def schedule_workshop(self, workshop_data: dict[str, Any]) -> dict[str, Any]:
        """Saves a confirmed workshop to the database and notifies students."""
        payload = {
            "title": workshop_data['title'],
            "description": workshop_data['description'],
            "skill_target": workshop_data['skill_target'],
            "curriculum": workshop_data['curriculum'],
            "student_ids": workshop_data['student_ids'],
            "scheduled_at": workshop_data.get('scheduled_at'),
            "status": "scheduled"
        }
        
        resp = (
            get_supabase_admin_client()
            .table("workshops")
            .insert(payload)
            .execute()
        )
        
        # Proactive: Push tasks to students
        for uid in workshop_data['student_ids']:
            self._notify_student(uid, workshop_data['title'])
            
        return resp.data[0] if resp.data else {}

    def _notify_student(self, user_id: str, workshop_title: str):
        """Pushes a workshop task to the student's dashboard."""
        from modules.system_ai.services import service as system_service
        try:
            state = system_service.get_state(user_id)
            import time
            new_task = {
                "id": f"wp-{int(time.time())}",
                "title": f"📅 Workshop Scheduled: {workshop_title}",
                "category": "Placement Drive",
                "completed": False,
                "due": "Upcoming",
                "source": "TPO"
            }
            tasks = state.get("tasks", [])
            tasks.insert(0, new_task)
            system_service.save_state(user_id=user_id, tasks=tasks)
        except Exception:
            pass

workshop_service = WorkshopService()
