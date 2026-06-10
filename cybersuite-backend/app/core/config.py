from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App Info
    APP_NAME: str = "CyberSuite API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Scan Limits
    MAX_PORT_RANGE: int = 1024
    MAX_SUBDOMAINS: int = 100
    SCAN_TIMEOUT: int = 5
    MAX_CONCURRENT_SCANS: int = 10

    # AI
    # AI
    AI_MODEL: str = "rule-based"
    GROQ_API_KEY: str = ...
    GROQ_API_URL: str = "https://api.groq.com/openai/v1"

    # Rate Limiting (B2)
    RATE_LIMIT: int = 30
    RATE_LIMIT_STRING: str = "30/minute"

    # JWT Secret (B1) — must be provided via environment; no hardcoded default allowed
    JWT_SECRET: str = ...

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()