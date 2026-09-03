from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    app_env: str = "development"
    app_secret_key: str = "dev-only-change-me"
    cors_origins: str = "http://localhost:3000"
    demo_mode: bool = True
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    ai_provider: str = "gemini"
    ai_api_key: str = ""
    gemini_api_key: str = ""
    ai_model: str = "gemini-2.0-flash"
    maps_api_key: str = ""


    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
