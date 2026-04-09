"""Supabase admin client for backend persistence."""

from __future__ import annotations

import os

from fastapi import HTTPException
from supabase import create_client, Client
from .config import settings


def get_supabase_admin_client() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    if not url or not key:
        raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured")
    return create_client(url, key)
