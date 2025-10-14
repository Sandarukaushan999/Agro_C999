import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MODEL_PATH: str = "models/potato_model_best.pth"
    DATASET_PATH: str = "dataset"
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env file

settings = Settings()
