import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Marketing Content Generator"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/marketing_db"
    )
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    YANDEX_API_KEY: Optional[str] = os.getenv("YANDEX_API_KEY")
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    IMAGE_MODEL: str = os.getenv("IMAGE_MODEL", "google/gemini-3-pro-image-preview")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
    LLM_BASE_URL: Optional[str] = os.getenv("LLM_BASE_URL")
    
    MOCK_MODE: bool = os.getenv("MOCK_MODE", "false").lower() == "true"
    
    RATE_LIMIT_PER_MINUTE: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
