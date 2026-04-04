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
        default="postgresql+asyncpg://postgres:postgres@rc-postgres:5432/recode",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://rc-redis:6379/0", alias="REDIS_URL")
    mongodb_url: str = Field(default="mongodb://admin:password@rc-mongodb:27017/?authSource=admin", alias="MONGODB_URL")
    mongodb_db_name: str = Field(default="form_builder", alias="MONGODB_DB_NAME")
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    resend_sender_email: str = Field(default="", alias="RESEND_SENDER_EMAIL")
    resend_sender_name: str = Field(default="", alias="RESEND_SENDER_NAME")
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    cors_allowed_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,https://formbar.manan.cloud",
        alias="CORS_ALLOWED_ORIGINS",
    )
    whatsapp_webhook_secret: str = Field(
        default="supersecretwhatsappkey", alias="WHATSAPP_WEBHOOK_SECRET"
    )
    whatsapp_basic_auth: str = Field(
        default="whatsappuser:whatsapppass", alias="WHATSAPP_BASIC_AUTH"
    )
    whatsapp_api_url: str = Field(
        default="http://rc-whatsapp:3001", alias="WHATSAPP_API_URL"
    )
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
