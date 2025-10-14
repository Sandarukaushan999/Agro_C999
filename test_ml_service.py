#!/usr/bin/env python3
import sys
import os

# Add the ml_service directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ml_service'))

try:
    print("Testing ML service imports...")
    
    # Test basic imports
    import torch
    print(f"[OK] PyTorch {torch.__version__} imported successfully")
    
    import fastapi
    print(f"[OK] FastAPI {fastapi.__version__} imported successfully")
    
    import uvicorn
    print(f"[OK] Uvicorn {uvicorn.__version__} imported successfully")
    
    # Test app imports
    from ml_service.app.config import settings
    print(f"[OK] Config loaded: MODEL_PATH={settings.MODEL_PATH}")
    
    from ml_service.app.model import PlantDiseaseModel
    print("[OK] PlantDiseaseModel imported successfully")
    
    from ml_service.main import app
    print("[OK] FastAPI app created successfully")
    
    print("\n[START] Starting ML service...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    
except Exception as e:
    print(f"[ERROR] Error: {e}")
    import traceback
    traceback.print_exc()
