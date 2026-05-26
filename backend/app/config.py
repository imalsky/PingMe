from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    BREVO_API_KEY: str = ""
    CRON_API_KEY: str
    FRONTEND_URL: str = "http://localhost:5173"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    model_config = {
        "env_file": "../.env",
        "env_file_encoding": "utf-8",
    }

    @property
    def database_url_async(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # asyncpg uses ssl=require instead of sslmode=require
        url = url.replace("?sslmode=require", "?ssl=require")
        url = url.replace("&sslmode=require", "&ssl=require")
        return url


settings = Settings()  # type: ignore[call-arg]
