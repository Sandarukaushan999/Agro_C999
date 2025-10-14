import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import logging
from typing import Dict, Any
import timm

logger = logging.getLogger(__name__)

class PlantDiseaseModel:
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.class_names = [
            'diseased_potato', 'healthy_potato'
        ]
        
        # Define plant and disease mappings for potato
        self.plant_mapping = {
            'diseased_potato': 'potato',
            'healthy_potato': 'potato'
        }
        
        self.disease_mapping = {
            'diseased_potato': 'unknown_disease',
            'healthy_potato': None
        }
        
        # Define transforms for inference
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    async def load_model(self, model_path: str):
        """Load the trained model"""
        try:
            if not os.path.exists(model_path):
                logger.warning(f"Model file not found at {model_path}, using pretrained model")
                # Create a pretrained model for demo purposes
                self.model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=len(self.class_names))
            else:
                # Load the actual trained model
                checkpoint = torch.load(model_path, map_location=self.device)
                self.model = timm.create_model('efficientnet_b0', pretrained=False, num_classes=len(self.class_names))
                self.model.load_state_dict(checkpoint['model_state_dict'])
                logger.info(f"Loaded trained potato model from {model_path}")
            
            self.model.to(self.device)
            self.model.eval()
            logger.info(f"Model loaded successfully on {self.device}")
            logger.info(f"Model classes: {self.class_names}")
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            # Fallback to pretrained model
            self.model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=len(self.class_names))
            self.model.to(self.device)
            self.model.eval()

    async def predict(self, image: np.ndarray) -> Dict[str, Any]:
        """Make prediction on the input image"""
        try:
            # Convert numpy array to PIL Image
            if isinstance(image, np.ndarray):
                image = Image.fromarray(image)
            
            # Apply transforms
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted_idx = torch.max(probabilities, 1)
                
                predicted_class = self.class_names[predicted_idx.item()]
                confidence_score = confidence.item()
                
                # Determine if healthy or diseased
                is_healthy = predicted_class.startswith('healthy_')
                prediction = 'healthy' if is_healthy else 'diseased'
                
                # Get plant type and disease type
                plant_type = self.plant_mapping.get(predicted_class, 'unknown')
                disease_type = self.disease_mapping.get(predicted_class, None)
                
                return {
                    'prediction': prediction,
                    'confidence': confidence_score,
                    'class_idx': predicted_idx.item(),
                    'predicted_class': predicted_class,
                    'plant_type': plant_type,
                    'disease_type': disease_type,
                    'all_probabilities': probabilities.cpu().numpy()[0].tolist()
                }
                
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise

    def get_class_names(self):
        """Get list of class names"""
        return self.class_names
