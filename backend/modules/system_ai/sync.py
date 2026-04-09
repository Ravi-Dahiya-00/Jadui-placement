"""
Cross-module Synchronization Bridge.
Connects Resume, GitHub, and Interview modules to the System State.
"""

from __future__ import annotations
from .services import service as system_service

def sync_resume_insights(user_id: str, skill_gaps: list[str]) -> None:
    """
    Called when a resume is analyzed. 
    Updates global skill gaps and triggers roadmap regeneration.
    """
    if not user_id or not skill_gaps:
        return
        
    print(f"Syncing {len(skill_gaps)} resume skill gaps for user {user_id}")
    
    # 1. Update the skill gaps and regenerate roadmap
    system_service.regenerate_roadmap(user_id, skill_gaps=skill_gaps)
    
    # 2. Update the "Today's Focus" tasks automatically
    system_service.generate_daily_plan(user_id)

def sync_github_insights(user_id: str, github_data: dict) -> None:
    """
    Updates global technical context based on GitHub activity.
    Allows the AI Mentor to know the user's actual tech stack.
    """
    if not user_id or not github_data:
        return
        
    state = system_service.get_state(user_id)
    chat_context = state.get("chat_context") or {}
    
    # Extract top languages (identity)
    langs = list((github_data.get("langRepoCount") or {}).keys())[:5]
    
    # Update context
    chat_context["github_tech_stack"] = langs
    chat_context["github_username"] = github_data.get("user", {}).get("login")
    chat_context["github_summary"] = github_data.get("insights", "")
    
    print(f"Syncing GitHub tech stack ({langs}) for user {user_id}")
    
    # Save back to global state
    system_service.save_state(
        user_id=user_id,
        tasks=state.get("tasks", []),
        roadmap=state.get("roadmap", []),
        notifications=state.get("notifications", []),
        skill_gaps=state.get("skill_gaps", []),
        chat_context=chat_context
    )

def sync_interview_insights(user_id: str, gaps: list[str]) -> None:
    """
    Updates global skill gaps based on interview performance.
    Triggers roadmap regeneration to address weaknesses.
    """
    if not user_id or not gaps:
        return
        
    print(f"Syncing {len(gaps)} interview gaps for user {user_id}")
    
    # Update the roadmap to address these new gaps
    system_service.regenerate_roadmap(user_id, skill_gaps=gaps)
    
    # Update the "Today's Focus" tasks automatically
    system_service.generate_daily_plan(user_id)
