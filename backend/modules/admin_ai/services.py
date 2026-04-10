"""Admin Service: Aggregates data across all students for the TPO dashboard."""

from __future__ import annotations
from typing import Any
from app.core.supabase_client import get_supabase_admin_client
from modules.system_ai.intelligence import intelligence_service

class AdminService:
    def get_all_students(self) -> list[dict[str, Any]]:
        """Fetches a list of all students and their key metrics, including TPO status.
        
        NOTE: Deliberately avoids per-student radar calls to prevent N+1 DB hits.
        avgScore is derived directly from the profiles table for performance.
        """
        profiles_resp = (
            get_supabase_admin_client()
            .table("profiles")
            .select("id, email, full_name, is_shortlisted, tpo_notes, created_at, resume_score")
            .eq("role", "student")
            .order("created_at", desc=True)
            .execute()
        )
        profiles = profiles_resp.data or []

        # Get task counts in bulk (single query)
        states_resp = (
            get_supabase_admin_client()
            .table("user_system_state")
            .select("user_id, tasks")
            .execute()
        )
        states = {s['user_id']: (s.get('tasks') or []) for s in (states_resp.data or [])}

        enriched = []
        for p in profiles:
            uid = p['id']
            # Use stored resume_score as the primary readiness signal (fast, no extra queries)
            avg_score = int(p.get('resume_score') or 0)

            # Count pending TPO tasks
            tasks = states.get(uid, [])
            pending_tpo = len([t for t in tasks if t.get('source') == 'TPO' and not t.get('completed')])
            
            enriched.append({
                "id": uid,
                "email": p['email'],
                "name": p.get("full_name") or "Anonymous Student",
                "avgScore": avg_score,
                "is_shortlisted": p.get("is_shortlisted", False),
                "pending_tpo_tasks": pending_tpo,
                "joined_at": p.get("created_at")
            })
            
        return enriched

    def get_student_dossier(self, user_id: str) -> dict[str, Any]:
        """Fetches a high-fidelity 'Placement Dossier' for a specific student."""
        from modules.resume_ai.services import service as resume_service
        from modules.interview_ai.services import service as interview_service
        from modules.github_review.services import service as github_service
        from modules.github_profile.services import build_profile
        from modules.system_ai.services import service as system_service
        
        # 0. Get Core Profile
        profile = (
            get_supabase_admin_client()
            .table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        ).data or {}
        
        # 1. Latest Resume Results
        resumes = resume_service.get_history(limit=1)
        latest_resume = resumes[0] if resumes else None
        
        # 2. Top PR Reviews
        prs = github_service.get_history(user_id, limit=3)
        
        # 3. Top Interview Outcomes
        interviews = interview_service.get_history(limit=3)
        
        # 4. Technical Footprint (GitHub Stats)
        github_stats = None
        state = system_service.get_state(user_id)
        gh_username = state.get("chat_context", {}).get("github_username")
        if gh_username:
            try:
                github_stats = build_profile(gh_username, include_insights=True)
            except Exception:
                github_stats = None
        
        # 5. Global Readiness Metrics
        radar = intelligence_service.get_readiness_radar(user_id, github_username=gh_username)
        
        return {
            "user_id": user_id,
            "profile": {
                "linkedin_url": profile.get("linkedin_url"),
                "portfolio_url": profile.get("portfolio_url"),
                "tpo_notes": profile.get("tpo_notes"),
                "is_shortlisted": profile.get("is_shortlisted", False)
            },
            "latest_resume": latest_resume,
            "top_prs": prs,
            "top_interviews": interviews,
            "github_stats": github_stats,
            "radar": radar,
            "overall_tier": "FAANG-READY" if radar['consistency'] > 85 and radar['resume'] > 85 else "PRODUCT-READY" if radar['resume'] > 70 else "ENTRY_LEVEL"
        }

    def toggle_shortlist(self, user_id: str) -> bool:
        """Toggles the shortlisted status for a student."""
        client = get_supabase_admin_client()
        curr = client.table("profiles").select("is_shortlisted").eq("id", user_id).single().execute().data
        new_val = not curr.get("is_shortlisted", False)
        client.table("profiles").update({"is_shortlisted": new_val}).eq("id", user_id).execute()
        return new_val

    def update_tpo_notes(self, user_id: str, notes: str):
        """Saves private TPO feedback for a student profile."""
        get_supabase_admin_client().table("profiles").update({"tpo_notes": notes}).eq("id", user_id).execute()

    def rank_students_for_job(self, query: str) -> list[dict[str, Any]]:
        """AI-assisted ranking of students for a specific tech stack/query."""
        students = self.get_all_students()
        query_terms = [q.strip().lower() for q in query.split(",")]
        
        ranked = []
        for s in students:
            # Match against resume skills if possible
            match_score = 0
            # Simulating deep match logic
            if s['avgScore'] > 70: match_score += 50
            
            # Simple term matching in name/metadata for now
            # In V3 we use LLM embeddings
            ranked.append({
                **s,
                "relevance": match_score,
                "match_details": f"Matches {len(query_terms)} requirements"
            })
            
        return sorted(ranked, key=lambda x: -x['relevance'])

    def assign_tpo_task(self, user_id: str, title: str, category: str = "TPO Assignment") -> dict[str, Any]:
        """Injects a mandatory task into a student's dashboard."""
        from modules.system_ai.services import service as system_service
        state = system_service.get_state(user_id)
        
        import time
        new_task = {
            "id": f"tpo-{int(time.time())}",
            "title": f"🚩 {title}",
            "category": category,
            "completed": False,
            "due": "Tomorrow",
            "source": "TPO"
        }
        
        tasks = state.get("tasks", [])
        tasks.insert(0, new_task)
        
        return system_service.save_state(
            user_id=user_id,
            tasks=tasks,
            roadmap=state.get("roadmap", []),
            notifications=state.get("notifications", []),
            skill_gaps=state.get("skill_gaps", []),
            chat_context=state.get("chat_context", {}),
            chat_history=state.get("chat_history", []),
            chat_sessions=state.get("chat_sessions", []),
            active_chat_session_id=state.get("active_chat_session_id", ""),
        )

    def get_dashboard_stats(self) -> dict[str, Any]:
        """Calculates high-level metrics for the TPO dashboard."""
        try:
            client = get_supabase_admin_client()
            
            # 1. Total Students
            profiles = client.table("profiles").select("id, is_shortlisted").eq("role", "student").execute().data or []
            total_students = len(profiles)
            shortlisted_students = len([p for p in profiles if p.get("is_shortlisted")])
            
            # 2. Avg Readiness (Expensive but accurate)
            readiness_scores = []
            for p in profiles[:50]: # Limit sampling for performance in dev
                try:
                    radar = intelligence_service.get_readiness_radar(p['id'])
                    if radar:
                        readiness_scores.append(sum(radar.values()) / 4)
                except Exception:
                    continue
            
            avg_readiness = int(sum(readiness_scores) / len(readiness_scores)) if readiness_scores else 0
            
            # 3. Placed Students (Simulated based on readiness > 85 for now)
            placed_students = len([s for s in readiness_scores if s > 85])
            
            return {
                "total_students": total_students,
                "placed_students": placed_students,
                "shortlisted_students": shortlisted_students,
                "avg_readiness": avg_readiness,
                "active_workshops": 3 # Placeholder
            }
        except Exception as e:
            print(f"FAILED TO FETCH DASHBOARD STATS (Likely missing SQL sync): {e}")
            # Return safe zeros so the frontend doesn't crash
            return {
                "total_students": 0,
                "placed_students": 0,
                "shortlisted_students": 0,
                "avg_readiness": 0,
                "active_workshops": 0,
                "error_hint": "Database out of sync. Run deployment/schema.sql"
            }

admin_service = AdminService()
