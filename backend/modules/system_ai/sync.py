"""User Sync Service: Ensures profiles and roles are consistent across the system."""

from __future__ import annotations
from app.core.supabase_client import get_supabase_admin_client

class UserSyncService:
    def ensure_profile(self, user_id: str, email: str, full_name: str | None = None) -> dict:
        """Upserts a user profile into the profiles table."""
        # Check if profile exists
        client = get_supabase_admin_client()
        resp = client.table("profiles").select("*").eq("id", user_id).execute()
        
        if not resp.data:
            # Create new profile
            payload = {
                "id": user_id,
                "email": email,
                "full_name": full_name or email.split("@")[0],
                "role": "student" # Default role
            }
            res = client.table("profiles").insert(payload).execute()
            return res.data[0] if res.data else {}
            
        return resp.data[0]

sync_service = UserSyncService()
