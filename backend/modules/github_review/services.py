"""GitHub PR Review Service: AI-powered code analysis and scoring."""

from __future__ import annotations
import httpx
import json
import os
from typing import Any
from fastapi import HTTPException
from app.core.config import settings
from app.core.supabase_client import get_supabase_admin_client
from .prompts import code_review_prompt, repo_analysis_prompt

GITHUB_API = "https://api.github.com"

class GitHubReviewService:
    def _headers(self) -> dict[str, str]:
        h = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        token = (settings.GITHUB_TOKEN or "").strip()
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

    async def fetch_repo_metadata(self, owner: str, repo: str) -> dict[str, Any]:
        """Fetches file tree and README to provide arch context."""
        headers = self._headers()
        async with httpx.AsyncClient() as client:
            # 1. Get Tree (recursive)
            tree_url = f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/main?recursive=1"
            # Fallback to master if main fails
            resp = await client.get(tree_url, headers=headers)
            if resp.status_code != 200:
                tree_url = f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/master?recursive=1"
                resp = await client.get(tree_url, headers=headers)
            
            tree_data = resp.json().get("tree", []) if resp.status_code == 200 else []
            files = [f["path"] for f in tree_data if f["type"] == "blob"][:150] # Limit to avoid bloat

            # 2. Get README
            readme_url = f"{GITHUB_API}/repos/{owner}/{repo}/readme"
            headers_raw = headers.copy()
            headers_raw["Accept"] = "application/vnd.github.raw"
            r_resp = await client.get(readme_url, headers=headers_raw)
            readme = r_resp.text[:2000] if r_resp.status_code == 200 else ""

            return {"files": files, "readme_snippet": readme, "owner": owner, "repo": repo}

    def _parse_ai_json(self, raw_text: str) -> dict[str, Any]:
        """Robustly extracts JSON from AI response."""
        try:
            cleaned = raw_text.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            return json.loads(cleaned)
        except Exception:
            # Last ditch attempt: find first { and last }
            try:
                start = raw_text.find("{")
                end = raw_text.rfind("}")
                if start != -1 and end != -1:
                    return json.loads(raw_text[start:end+1])
            except: pass
            raise HTTPException(status_code=500, detail="AI Analysis failed to generate a valid JSON review.")

    async def analyze_diff(self, diff_text: str) -> dict[str, Any]:
        """Uses AI to review the diff and generate a scorecard."""
        if not diff_text.strip():
            return {"score": 100, "summary": "Empty diff.", "strengths": ["Clean"], "bugs": [], "security_risks": [], "ideal_code": None}

        prompt = code_review_prompt.replace("{{DIFF_TEXT}}", diff_text[:12000])
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = await model.generate_content_async(prompt)
            return self._parse_ai_json(response.text)
        except Exception as e:
            print(f"Code Review AI failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def analyze_repo(self, metadata: dict[str, Any]) -> dict[str, Any]:
        """Project-wide architecture and quality audit."""
        prompt = repo_analysis_prompt.replace("{{REPO_METADATA}}", json.dumps(metadata, indent=2))
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = await model.generate_content_async(prompt)
            return self._parse_ai_json(response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def save_review(self, user_id: str, owner: str, repo: str, pr_number: int, review: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "user_id": user_id, "repo_owner": owner, "repo_name": repo, "pr_number": pr_number,
            "score": review.get("score", 0), "summary": review.get("summary"),
            "strengths": review.get("strengths", []), "bugs": review.get("bugs", []),
            "security_risks": review.get("security_risks", []), "ideal_code": review.get("ideal_code"),
        }
        resp = get_supabase_admin_client().table("github_pr_reviews").insert(payload).execute()
        return resp.data[0] if resp.data else {}

    def save_repo_analysis(self, user_id: str, owner: str, repo: str, analysis: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "user_id": user_id, "repo_owner": owner, "repo_name": repo,
            "architecture_score": analysis.get("architecture_score", 0),
            "tech_stack": analysis.get("tech_stack", []),
            "summary": analysis.get("summary"),
            "design_patterns": analysis.get("design_patterns", []),
            "technical_debt": analysis.get("technical_debt", []),
        }
        resp = get_supabase_admin_client().table("github_repo_analyses").insert(payload).execute()
        return resp.data[0] if resp.data else {}

    def get_history(self, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
        resp = get_supabase_admin_client().table("github_pr_reviews").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        return resp.data or []

    def get_repo_history(self, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
        resp = get_supabase_admin_client().table("github_repo_analyses").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        return resp.data or []

service = GitHubReviewService()
