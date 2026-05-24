from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Nova API"
    app_env: str = "development"
    app_debug: bool = True
    log_level: str = "INFO"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/nova"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 30

    app_base_url: str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173"

    lemonsqueezy_api_key: str = ""
    lemonsqueezy_store_id: str = ""
    lemonsqueezy_starter_variant_id: str = ""
    lemonsqueezy_pro_variant_id: str = ""
    lemonsqueezy_webhook_secret: str = ""
    payment_webhook_secret: str = ""

    resend_api_key: str = ""
    email_from_address: str = "noreply@novabookkeeping.com"

    clerk_secret_key: str = ""
    clerk_jwt_audience: str = ""

    @field_validator("app_debug", mode="before")
    @classmethod
    def force_bool(cls, value):
        if isinstance(value, bool):
            return value
        return str(value).lower() in {"1", "true", "yes", "on"}

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
