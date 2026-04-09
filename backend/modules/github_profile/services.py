"""
GitHub public profile aggregation — logic ported from Kotlin (UserService, CommitCountUtil).

Original: profile-summary-for-github — repos per language, commits per language/quarter/repo, stars.
"""

from __future__ import annotations

import json
import os
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

import httpx
from dateutil.relativedelta import relativedelta
from fastapi import HTTPException

GITHUB_API = "https://api.github.com"
CACHE_TTL_SEC = 6 * 3600
_cache: dict[str, tuple[float, dict[str, Any]]] = {}


def _headers() -> dict[str, str]:
    h = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = (os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN") or "").strip()
    if token:
        # Support comma-separated token pool like the original app
        first = token.split(",")[0].strip()
        h["Authorization"] = f"Bearer {first}"
    return h


def _max_repos() -> int:
    return max(5, min(80, int(os.getenv("GITHUB_PROFILE_MAX_REPOS", "40"))))


def _get_cached(username: str) -> dict[str, Any] | None:
    key = username.lower()
    if key not in _cache:
        return None
    ts, data = _cache[key]
    if time.time() - ts > CACHE_TTL_SEC:
        del _cache[key]
        return None
    return data


def _set_cached(username: str, data: dict[str, Any]) -> None:
    _cache[username.lower()] = (time.time(), data)


def _parse_github_dt(iso: str) -> datetime:
    if iso.endswith("Z"):
        iso = iso.replace("Z", "+00:00")
    return datetime.fromisoformat(iso)


def _year_quarter(dt: datetime) -> str:
    dt = dt.astimezone(timezone.utc)
    q = (dt.month - 1) // 3 + 1
    return f"{dt.year}-Q{q}"


def _quarter_keys_between(created: datetime, end: datetime) -> list[str]:
    """Ordered quarter labels from account creation through current quarter."""
    created = created.astimezone(timezone.utc)
    end = end.astimezone(timezone.utc)
    y, m = created.year, created.month
    cq = (m - 1) // 3 + 1
    cy, cm = end.year, end.month
    end_q = (cm - 1) // 3 + 1
    keys: list[str] = []
    while (y, cq) <= (cy, end_q):
        keys.append(f"{y}-Q{cq}")
        cq += 1
        if cq > 4:
            cq = 1
            y += 1
    return keys


def _commits_for_quarters(
    user_created: datetime,
    repo_to_commits: dict[str, list[dict[str, Any]]],
) -> dict[str, int]:
    now = datetime.now(timezone.utc)
    buckets = {k: 0 for k in _quarter_keys_between(user_created, now)}
    for commits in repo_to_commits.values():
        for c in commits:
            try:
                date_s = c.get("commit", {}).get("author", {}).get("date") or c.get("commit", {}).get("committer", {}).get("date")
                if not date_s:
                    continue
                dt = _parse_github_dt(date_s)
                k = _year_quarter(dt)
                if k in buckets:
                    buckets[k] += 1
            except Exception:
                continue
    return dict(sorted(buckets.items()))


def _fetch_paginated(client: httpx.Client, url: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    next_url: str | None = url
    next_params = params
    for _ in range(25):
        if not next_url:
            break
        r = client.get(next_url, params=next_params, headers=_headers(), timeout=60.0)
        if r.status_code == 403:
            raise HTTPException(status_code=503, detail="GitHub API rate limit or access denied. Set GITHUB_TOKEN on the backend.")
        if r.status_code != 200:
            break
        data = r.json()
        if isinstance(data, list):
            out.extend(data)
        next_url = r.links.get("next", {}).get("url") if r.links else None
        next_params = None
    return out


def _fetch_commits_for_repo(
    client: httpx.Client,
    owner: str,
    repo: str,
    author_login: str,
) -> list[dict[str, Any]]:
    url = f"{GITHUB_API}/repos/{owner}/{repo}/commits"
    params = {"author": author_login, "per_page": 100}
    raw = _fetch_paginated(client, url, params)
    login_l = author_login.lower()
    filtered: list[dict[str, Any]] = []
    for c in raw:
        auth = c.get("author")
        if auth and (auth.get("login") or "").lower() == login_l:
            filtered.append(c)
    return filtered


def _user_to_client_shape(u: dict[str, Any]) -> dict[str, Any]:
    return {
        "login": u.get("login"),
        "avatarUrl": u.get("avatar_url"),
        "htmlUrl": u.get("html_url"),
        "name": u.get("name"),
        "publicRepos": u.get("public_repos", 0),
        "createdAt": u.get("created_at"),
    }


def _maybe_gemini_insights(profile: dict[str, Any]) -> str | None:
    if os.getenv("GITHUB_PROFILE_DISABLE_AI", "").lower() in ("1", "true", "yes"):
        return None
    if not os.getenv("GEMINI_API_KEY"):
        return None
    try:
        import google.generativeai as genai  # type: ignore
    except ImportError:
        return None
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    model = genai.GenerativeModel(model_name)
    summary = {
        "login": profile.get("user", {}).get("login"),
        "quarterCommitCount": profile.get("quarterCommitCount"),
        "langRepoCount": profile.get("langRepoCount"),
        "langCommitCount": profile.get("langCommitCount"),
        "topReposByCommits": list((profile.get("repoCommitCount") or {}).items())[:8],
    }
    prompt = f"""You are a Career Coach and Technical Recruiter. Analyze this GitHub profile for a job candidate:
{json.dumps(summary, indent=2)}

Provide a sharp, professional assessment for a "Jadui Placement" profile:
1. **Technical Identity**: What kind of engineer are they based on language dominance?
2. **Commitment & Velocity**: Analyze their activity trend (is it growing, steady, or dormant?).
3. **Project Impact**: highlight their most significant repositories based on stars/commits and what they reveal about their skills.
4. **Career Verdict**: What roles are they best suited for (Frontend, Backend, AI, etc.)?
5. **Actionable Growth**: One high-impact technical goal to improve their "hireability".

Keep it to 5 concise bullet points. Use **bolding** for key skills and metrics. Plain text output."""
    resp = model.generate_content(prompt)
    return (resp.text or "").strip() or None


def build_profile(username: str, include_insights: bool) -> dict[str, Any]:
    username = username.strip()
    if not username or len(username) > 39:
        raise HTTPException(status_code=400, detail="Invalid username")

    cached = _get_cached(username)
    if cached is not None:
        out = dict(cached)
        if include_insights and not out.get("insights"):
            ins = _maybe_gemini_insights(out)
            if ins:
                out["insights"] = ins
                _set_cached(username, out)
        return out

    with httpx.Client() as client:
        ur = client.get(f"{GITHUB_API}/users/{username}", headers=_headers(), timeout=30.0)
        if ur.status_code == 404:
            raise HTTPException(status_code=404, detail="GitHub user not found")
        if ur.status_code != 200:
            raise HTTPException(status_code=502, detail=f"GitHub user lookup failed: {ur.status_code}")
        gh_user = ur.json()

        repos = _fetch_paginated(
            client,
            f"{GITHUB_API}/users/{username}/repos",
            {"per_page": 100, "type": "owner", "sort": "updated"},
        )
        # Non-fork, non-empty (size > 0 KB), public implied in list for others
        filtered = [r for r in repos if not r.get("fork") and (r.get("size") or 0) > 0]
        filtered = sorted(
            filtered,
            key=lambda x: x.get("updated_at") or "",
            reverse=True,
        )[: _max_repos()]

        repo_commits: dict[str, list[dict[str, Any]]] = {}
        for repo in filtered:
            name = repo.get("name")
            if not name:
                continue
            try:
                repo_commits[name] = _fetch_commits_for_repo(client, username, name, username)
            except HTTPException:
                raise
            except Exception:
                repo_commits[name] = []

        user_created = _parse_github_dt(gh_user["created_at"])
        quarter_commit_count = _commits_for_quarters(user_created, repo_commits)

        lang_repo: dict[str, int] = defaultdict(int)
        lang_stars: dict[str, int] = defaultdict(int)
        lang_commits: dict[str, int] = defaultdict(int)

        for repo in filtered:
            lang = repo.get("language") or "Unknown"
            lang_repo[lang] += 1
            lang_stars[lang] += int(repo.get("stargazers_count") or 0)
            nm = repo.get("name")
            if nm:
                lang_commits[lang] += len(repo_commits.get(nm, []))

        def sort_map(m: dict[str, int]) -> dict[str, int]:
            return dict(sorted(m.items(), key=lambda x: -x[1]))

        lang_repo_count = sort_map(dict(lang_repo))
        lang_star_count = sort_map({k: v for k, v in lang_stars.items() if v > 0})
        lang_commit_count = sort_map(dict(lang_commits))

        repo_commit_count = sort_map({n: len(repo_commits[n]) for n in repo_commits}) if repo_commits else {}
        repo_commit_top = dict(list(repo_commit_count.items())[:10])

        repo_star = {
            r.get("name"): int(r.get("stargazers_count") or 0)
            for r in filtered
            if (r.get("stargazers_count") or 0) > 0 and r.get("name")
        }
        repo_star = dict(sorted(repo_star.items(), key=lambda x: -x[1])[:10])

        desc_by_name = {r.get("name"): r.get("description") for r in filtered if r.get("name")}

        out = {
            "user": _user_to_client_shape(gh_user),
            "quarterCommitCount": quarter_commit_count,
            "langRepoCount": lang_repo_count,
            "langStarCount": lang_star_count,
            "langCommitCount": lang_commit_count,
            "repoCommitCount": repo_commit_top,
            "repoStarCount": repo_star,
            "repoCommitCountDescriptions": {k: desc_by_name.get(k) for k in repo_commit_top},
            "repoStarCountDescriptions": {k: desc_by_name.get(k) for k in repo_star},
            "meta": {
                "reposAnalyzed": len(filtered),
                "totalReposListed": len(repos),
                "cached": False,
            },
        }

    _set_cached(username, out)
    if include_insights:
        ins = _maybe_gemini_insights(out)
        if ins:
            out["insights"] = ins
            _set_cached(username, out)
    return out


def can_load_quick(username: str) -> bool:
    """Lightweight check — cached profile or we can call GitHub (token recommended)."""
    if _get_cached(username.strip()) is not None:
        return True
    return True
