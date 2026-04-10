"""TPO Assistant Service: Powered by AI to analyze batch data and answer queries."""

from __future__ import annotations
import json
from typing import Any
from app.core.config import settings
from .services import admin_service

class TPOAssistantService:
    def _build_batch_context(self) -> str:
        """Serializes current batch data into a concise context for the AI."""
        stats = admin_service.get_dashboard_stats()
        students = admin_service.get_all_students()
        
        # Sort top performers
        top_performers = sorted(students, key=lambda x: -x['avgScore'])[:5]
        
        context = {
            "batch_summary": stats,
            "top_5_students": [
                {
                    "name": s['name'],
                    "avg_score": s['avgScore'],
                    "radar": s['radar']
                } for s in top_performers
            ],
            # To avoid token bloat, we don't send every student, 
            # but we mention the total count and general trends.
            "total_students_count": len(students)
        }
        
        return json.dumps(context, indent=2)

    async def generate_response(self, query: str, chat_history: list[dict] = []) -> str:
        """Generates an AI response based on batch data and TPO query."""
        context = self._build_batch_context()
        
        # Prefer Gemini for batch analysis
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            
            system_prompt = f"""
            You are the "Jadui TPO Assistant" — an elite AI advisor for the Training & Placement Officer.
            You have access to the following aggregate student data:
            {context}

            Your goal is to help the TPO make data-driven decisions about placement and training.
            1. Be professional, direct, and elite in your tone.
            2. When asked for students, use the data to identify the best matches.
            3. If asked about weaknesses, look at the 'topSkillGaps' in the stats.
            4. Keep responses concise and actionable.
            
            Always prioritize factual data from the context provided above.
            """
            
            full_prompt = f"System: {system_prompt}\n\nUser Question: {query}"
            response = await model.generate_content_async(full_prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"TPO Assistant Error: {e}")
            # Fallback to a simple message
            return "Sir, I'm currently having trouble accessing the batch database. Please try again in a moment."

assistant_service = TPOAssistantService()
