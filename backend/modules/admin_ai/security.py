"""Security layer for protecting the Admin Panel from unauthorized access and brute force attacks."""

from __future__ import annotations
import os
import time
from fastapi import HTTPException, Request, Header

# In-memory tracking (resets on server restart)
# In production, this should ideally be in Redis/Supabase for persistence
failed_attempts: dict[str, int] = {}
blocked_ips: dict[str, float] = {} # IP -> Unblock time

BLOCK_DURATION = 86400 # 24 hours
MAX_ATTEMPTS = 6

def get_client_ip(request: Request) -> str:
    """Helper to extract IP even through proxies (like Vercel/Render)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def check_ip_block(request: Request):
    """Dependency to check if the current IP is blocked."""
    ip = get_client_ip(request)
    now = time.time()
    
    if ip in blocked_ips:
        if now < blocked_ips[ip]:
            remaining = int((blocked_ips[ip] - now) // 60)
            raise HTTPException(
                status_code=403, 
                detail=f"Too many failed attempts. Your IP is blocked for {remaining} more minutes."
            )
        else:
            # Block expired
            del blocked_ips[ip]
            failed_attempts[ip] = 0

def record_failure(request: Request):
    """Increments failure count and blocks if limit reached."""
    ip = get_client_ip(request)
    failed_attempts[ip] = failed_attempts.get(ip, 0) + 1
    
    if failed_attempts[ip] >= MAX_ATTEMPTS:
        blocked_ips[ip] = time.time() + BLOCK_DURATION
        print(f"SECURITY: Blocked IP {ip} after {MAX_ATTEMPTS} failed attempts.")

def verify_token(request: Request, x_admin_token: str | None = Header(None)):
    """
    Validates the admin token. 
    In this simplified version, the token IS the password (sent via custom header).
    The frontend will store the successful password in sessionStorage as a 'token'.
    """
    check_ip_block(request)
    
    expected = os.getenv("ADMIN_PANEL_PASSWORD")
    if not expected:
        # If no password set, we fail safe (nobody gets in)
        raise HTTPException(status_code=500, detail="Admin security not configured.")
        
    if x_admin_token != expected:
        record_failure(request)
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")
    
    # Reset failures on success
    ip = get_client_ip(request)
    if ip in failed_attempts:
        failed_attempts[ip] = 0
