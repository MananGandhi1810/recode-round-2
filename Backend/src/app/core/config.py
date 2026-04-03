from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore"
    )

    port: int = Field(default=8000, alias="PORT")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    secret_key: str = Field(default="change-me-in-env", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(
        default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/workspace_auth",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    mongodb_url: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URL")
    mongodb_db_name: str = Field(default="form_builder", alias="MONGODB_DB_NAME")
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    resend_sender_email: str = Field(default="", alias="RESEND_SENDER_EMAIL")
    resend_sender_name: str = Field(default="", alias="RESEND_SENDER_NAME")
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
