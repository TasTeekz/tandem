from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    postgres_url: str
    jwt_secret: str
    jwt_access_ttl_min: int = 30
    jwt_refresh_ttl_days: int = 14
    cors_origins: str = "http://localhost:5173"
    max_upload_mb: int = 10
    admin_email: str | None = None
    admin_password: str | None = None
    bcrypt_rounds: int = 12

    @field_validator("jwt_secret")
    @classmethod
    def _strong_secret(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v

    @field_validator("postgres_url")
    @classmethod
    def _async_driver(cls, v: str) -> str:
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                v = "postgresql+asyncpg://" + v[len(prefix) :]
        return v.replace("sslmode=", "ssl=")  # asyncpg spells it `ssl`

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
