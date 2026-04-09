from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # AI Providers
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3-8b-8192"
    OPENAI_API_KEY: Optional[str] = None
    
    # App Settings
    PORT: int = 8000
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
