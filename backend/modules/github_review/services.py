"""GitHub PR Review Service: AI-powered code analysis and scoring."""

from __future__ import annotations
import httpx
import json
import os
from typing import Any
from fastapi import HTTPException
from app.core.config import settings
from app.core.supabase_client import get_supabase_admin_client
from .prompts import code_review_prompt

GITHUB_API = "https://api.github.com"

class GitHubReviewService:
    def _headers(self) -> dict[str, str]:
        h = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        token = settings.GITHUB_TOKEN.strip()
        if token:
            first = token.split(",")[0].strip()
            h["Authorization"] = f"Bearer {first}"
        return h

    async def fetch_pr_diff(self, owner: str, repo: str, pr_number: int) -> str:
        """Fetches the raw diff of a Pull Request."""
        url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}"
        headers = self._headers()
        headers["Accept"] = "application/vnd.github.v3.diff" # Crucial for diff text

        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=30.0)
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="PR not found or inaccessible")
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"GitHub API error: {resp.status_code}")
            return resp.text

    async def analyze_diff(self, diff_text: str) -> dict[str, Any]:
        """Uses AI to review the diff and generate a scorecard."""
        if not diff_text.strip():
            return {
                "score": 100,
                "summary": "Empty diff. No changes to review.",
                "strengths": ["Clean slate"],
                "bugs": [],
                "security_risks": [],
                "ideal_code": None
            }

        # AI analysis logic
        prompt = code_review_prompt.replace("{{DIFF_TEXT}}", diff_text[:12000]) # Cap for token limits
        
        # Prefer Gemini for long diffs, fallback to Groq/Llama
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = await model.generate_content_async(prompt)
            
            # Expecting JSON from the prompt
            raw_text = response.text.strip()
            # Basic cleanup if AI adds markdown code blocks
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                raw_text = raw_text.split("```")[1].split("```")[0].strip()
                
            return json.loads(raw_text)
        except Exception as e:
            print(f"Code Review AI failed: {e}")
            raise HTTPException(status_code=500, detail="AI Analysis failed to generate a valid review.")

    def save_review(
        self, 
        user_id: str, 
        owner: str, 
        repo: str, 
        pr_number: int, 
        review: dict[str, Any]
    ) -> dict[str, Any]:
        """Persists the review to Supabase."""
        payload = {
            "user_id": user_id,
            "repo_owner": owner,
            "repo_name": repo,
            "pr_number": pr_number,
            "score": review.get("score", 0),
            "summary": review.get("summary"),
            "strengths": review.get("strengths", []),
            "bugs": review.get("bugs", []),
            "security_risks": review.get("security_risks", []),
            "ideal_code": review.get("ideal_code"),
        }
        resp = (
            get_supabase_admin_client()
            .table("github_pr_reviews")
            .insert(payload)
            .execute()
        )
        return resp.data[0] if resp.data else {}

    def get_history(self, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
        resp = (
            get_supabase_admin_client()
            .table("github_pr_reviews")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return resp.data or []

service = GitHubReviewService()
