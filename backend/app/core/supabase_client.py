"""Supabase admin client for backend persistence."""

from __future__ import annotations

import os

from fastapi import HTTPException


def get_supabase_admin_client():
    try:
        from supabase import create_client  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail="supabase dependency missing") from exc

    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        raise HTTPException(status_code=500, detail="SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing")
    return create_client(url, service_key)
