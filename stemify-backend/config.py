from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://srujan@localhost:5432/stemify"
    upload_dir: str = "./uploads"
    stems_dir: str = "./stems"
    max_file_size_mb: int = 50

    class Config:
        env_file = ".env"

settings = Settings()
