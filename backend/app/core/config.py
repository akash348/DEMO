from pydantic import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Pragati Institute API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-this-in-env"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    ALGORITHM: str = "HS256"
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./pragati.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    MEDIA_MAX_SIZE_MB: int = 25

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
