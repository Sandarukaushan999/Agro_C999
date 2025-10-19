from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
from prometheus_fastapi_instrumentator import Instrumentator

from app.model import PlantDiseaseModel
from app.preprocessing import preprocess_image
from app.explain import generate_gradcam_explanation
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set deterministic behavior for consistent predictions
try:
    import torch, numpy as np, random
    torch.manual_seed(42)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(42)
    np.random.seed(42)
    random.seed(42)
    # Ensure deterministic convolutions
    if hasattr(torch.backends, 'cudnn'):
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
    # Enforce deterministic algorithms where possible
    if hasattr(torch, 'use_deterministic_algorithms'):
        torch.use_deterministic_algorithms(True)
except Exception:
    pass

# Initialize FastAPI app
app = FastAPI(
    title="Agro_C ML Service",
    description="Plant Disease Identification ML Service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Prometheus metrics
instrumentator = Instrumentator()
instrumentator.instrument(app).expose(app)

# Global model instance
model = None

@app.on_event("startup")
async def startup_event():
    """Initialize the model on startup"""
    global model
    try:
        logger.info("Loading plant disease model...")
        model = PlantDiseaseModel()
        await model.load_model(settings.MODEL_PATH)
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

@app.post("/model/switch")
async def switch_model(plant: str = Body(..., embed=True)):
    """Switch active plant model (potato/tomato)."""
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    try:
        plant_norm = plant.lower().strip()
        if plant_norm == 'potato':
            model_path = settings.POTATO_MODEL_PATH
        elif plant_norm == 'tomato':
            model_path = settings.TOMATO_MODEL_PATH
        else:
            raise HTTPException(status_code=400, detail="Unsupported plant. Use 'potato' or 'tomato'.")

        await model.switch_plant(plant_norm, model_path)
        return {"success": True, "activePlant": plant_norm, "classes": model.class_names}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to switch model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }

@app.post("/predict")
async def predict_plant_disease(file: UploadFile = File(...)):
    """
    Predict plant disease from uploaded image
    """
    try:
        if not model:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Preprocess image
        processed_image = preprocess_image(image_data)
        
        # Make prediction
        prediction_result = await model.predict(processed_image)
        
        # Generate explanation if confidence is high enough
        explanation_url = None
        # Temporarily disable Grad-CAM to fix the gradient issue
        # if prediction_result['confidence'] > 0.4:
        #     try:
        #         explanation_url = generate_gradcam_explanation(
        #             model.model, 
        #             processed_image, 
        #             prediction_result['class_idx']
        #         )
        #         if explanation_url:
        #             logger.info(f"Generated explanation: {explanation_url}")
        #         else:
        #             logger.info("Explanation generation returned None")
        #     except Exception as e:
        #         logger.warning(f"Failed to generate explanation: {e}")
        #         # Don't fail the entire prediction if explanation fails
        #         explanation_url = None
        
        return {
            "prediction": prediction_result['prediction'],
            "confidence": float(prediction_result['confidence']),
            "plantType": prediction_result['plant_type'],
            "diseaseType": prediction_result['disease_type'],
            "predictedClass": prediction_result.get('predicted_class'),
            "allProbabilities": prediction_result.get('all_probabilities'),
            "modelAccuracy": getattr(model, 'model_val_accuracy', None),
            "explanation": explanation_url,
            "model_version": "1.0.0"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/model/info")
async def model_info():
    """Get model information"""
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_name": "Plant Disease Classifier",
        "version": "1.0.0",
        "architecture": "EfficientNet-B0",
        "num_classes": len(model.class_names),
        "class_names": model.class_names,
        "input_size": (224, 224),
        "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"]
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
