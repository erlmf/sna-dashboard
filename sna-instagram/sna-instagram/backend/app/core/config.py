from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://sna_user:sna_password@localhost:5432/sna_instagram"
    )

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Graph data path (output from notebooks)
    GRAPH_DATA_PATH: str = os.getenv("GRAPH_DATA_PATH", "../data/processed/graph_data.json")
    INFLUENCER_CSV_PATH: str = os.getenv("INFLUENCER_CSV_PATH", "../data/processed/influencer_ranking.csv")
    COMMUNITY_CSV_PATH: str = os.getenv("COMMUNITY_CSV_PATH", "../data/processed/community_profiles.csv")
    DATASET_PATH: str = os.getenv("DATASET_PATH", "../data/processed/dataset_clean.csv")

    class Config:
        env_file = ".env"


settings = Settings()
