"""
Unified Intelligence Layer: Aggregates Resume, Interview, and GitHub metrics.
Generates placement-specific suggestions and 'Readiness Radar' data.
"""

from __future__ import annotations
from typing import Any
import math
from modules.resume_ai.services import service as resume_service
from modules.interview_ai.services import service as interview_service
from modules.github_profile.services import build_profile

class CareerIntelligenceService:
    def get_readiness_radar(self, user_id: str, github_username: str | None = None) -> dict[str, int]:
        """
        Calculates scores for a 4-point Radar Chart:
        1. Resume Quality
        2. Technical Depth (GitHub)
        3. Interview Performance
        4. Consistency (Tasks/Activity)
        """
        # 1. Resume Score (Average of all analyses)
        resume_history = resume_service.get_history(limit=5)
        resume_score = 0
        if resume_history:
            resume_score = int(sum(r['score'] for r in resume_history) / len(resume_history))
            
        # 2. Interview Score (Average of all sessions)
        interview_history = interview_service.get_history(limit=5)
        interview_score = 0
        if interview_history:
            interview_score = int(sum(i['overall_score'] for i in interview_history) / len(interview_history))
            
        # 3. Technical Depth (GitHub)
        github_score = 0
        if github_username:
            try:
                gh_profile = build_profile(github_username, include_insights=False)
                # Simple logic: stars, repo count, and commits
                stars = sum(gh_profile.get('repoStarCount', {}).values())
                commits = sum(gh_profile.get('repoCommitCount', {}).values())
                repos = gh_profile.get('meta', {}).get('reposAnalyzed', 0)
                
                s_pts = min(40, stars * 2) # max 40 from stars
                r_pts = min(30, repos * 3) # max 30 from repo count
                c_pts = min(30, commits / 5) # max 30 from commits
                github_score = int(s_pts + r_pts + c_pts)
            except Exception:
                github_score = 0
                
        # 4. Consistency (Currently static or based on tasks if we had easier access)
        # For now, we'll base it on how many things they've tried
        tried_count = (1 if resume_history else 0) + (1 if interview_history else 0) + (1 if github_username else 0)
        consistency_score = int((tried_count / 3) * 100)

        return {
            "resume": resume_score,
            "technical": github_score,
            "interview": interview_score,
            "consistency": consistency_score
        }

    def get_placement_suggestions(self, github_username: str) -> list[str]:
        """Generates high-impact resume bullet point suggestions based on GitHub activity."""
        try:
            gh_profile = build_profile(github_username, include_insights=False)
            top_repos = sorted(
                gh_profile.get('repoStarCount', {}).items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:3]
            
            suggestions = []
            for name, stars in top_repos:
                desc = gh_profile.get('repoStarCountDescriptions', {}).get(name) or "a high-impact technical project"
                # Generate professional-sounding bullet points
                if stars > 10:
                    suggestions.append(
                        f"Architected and maintained '{name}' ({desc}), achieving over {stars} stars from the developer community."
                    )
                else:
                    langs = list(gh_profile.get('langRepoCount', {}).keys())[:2]
                    lang_str = " and ".join(langs) if langs else "modern frameworks"
                    suggestions.append(
                        f"Engineered '{name}', a robust project focused on {desc}, leverageing {lang_str} for optimized performance."
                    )
            
            if not suggestions:
                return ["Your GitHub profile is ready. Start building more public repositories to unlock AI resume boosters!"]
            return suggestions
        except Exception:
            return ["Link your GitHub profile in the scanner to unlock automatic technical resume boosters."]

intelligence_service = CareerIntelligenceService()
