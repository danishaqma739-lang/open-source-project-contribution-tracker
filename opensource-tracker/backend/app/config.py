from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    github_client_id: str
    github_client_secret: str
    github_redirect_uri: str
    frontend_url: str = "http://localhost:5173"
    session_secret: str
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    session_max_age_seconds: int = 60 * 60 * 24 * 7


settings = Settings()
