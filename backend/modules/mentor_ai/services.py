"""Gemini-powered mentor replies (shared key with interview module on Render)."""

from __future__ import annotations

import os
from typing import Any

from fastapi import HTTPException


class MentorService:
    def generate_reply(self, system_prompt: str, history: list[dict[str, Any]], message: str) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured on backend")

        try:
            import google.generativeai as genai  # type: ignore
        except ImportError as exc:  # pragma: no cover
            raise HTTPException(status_code=500, detail="Gemini SDK not installed") from exc

        genai.configure(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        gen_cfg = {
            "temperature": float(os.getenv("MENTOR_TEMPERATURE", "0.88")),
            "max_output_tokens": int(os.getenv("MENTOR_MAX_OUTPUT_TOKENS", "2048")),
        }
        model = genai.GenerativeModel(model_name, generation_config=gen_cfg)

        full_prompt = self._build_prompt(system_prompt, history, message)
        response = model.generate_content(full_prompt)
        text = (response.text or "").strip()
        if not text:
            raise HTTPException(status_code=502, detail="Empty model response")
        return text

    def _build_prompt(self, system_prompt: str, history: list[dict[str, Any]], message: str) -> str:
        lines: list[str] = [
            system_prompt.strip(),
            "",
            "---",
            "Conversation:",
            "",
        ]
        for h in history[-16:]:
            role = (h.get("role") or "user").lower()
            content = str(h.get("content") or "").strip()
            if not content:
                continue
            if role == "assistant":
                lines.append(f"Assistant: {content}")
            else:
                lines.append(f"User: {content}")
        lines.append("")
        lines.append(
            "User: Latest question (answer this specifically; do not repeat generic advice):\n"
            + message.strip()[:8000]
        )
        lines.append("")
        lines.append("Assistant:")
        return "\n".join(lines)


service = MentorService()
