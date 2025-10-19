import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MODEL_PATH: str = "models/potato_model_best.pth"
    POTATO_MODEL_PATH: str = "models/potato_model_best.pth"
    # Point directly to the trained tomato checkpoint produced by training script
    TOMATO_MODEL_PATH: str = "ml_training/models/tomato/tomato_model_best.pth"
    TOMATO_INVERT_OUTPUT: bool = True
    DATASET_PATH: str = "dataset"
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env file

settings = Settings()
