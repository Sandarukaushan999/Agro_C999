import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import logging
from typing import Dict, Any, Optional
import timm

logger = logging.getLogger(__name__)

class PlantDiseaseModel:
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.current_plant: str = 'potato'
        self.model_val_accuracy: Optional[float] = None

        # Default to potato classes
        self.class_names = ['diseased_potato', 'healthy_potato']

        # Define plant and disease mappings
        self._potato_class_names = ['diseased_potato', 'healthy_potato']
        self._potato_plant_mapping = {
            'diseased_potato': 'potato',
            'healthy_potato': 'potato'
        }
        self._potato_disease_mapping = {
            'diseased_potato': 'unknown_disease',
            'healthy_potato': None
        }

        # Tomato mappings (match trained checkpoint: index 0 = diseased, 1 = healthy)
        self._tomato_class_names = ['diseased_tomato', 'healthy_tomato']
        self._tomato_plant_mapping = {
            'diseased_tomato': 'tomato',
            'healthy_tomato': 'tomato'
        }
        self._tomato_disease_mapping = {
            'diseased_tomato': 'unknown_disease',
            'healthy_tomato': None
        }

        self.plant_mapping = dict(self._potato_plant_mapping)
        self.disease_mapping = dict(self._potato_disease_mapping)

        # Define transforms for inference
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.CenterCrop(224),
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
                self.model_val_accuracy = None
            else:
                # Load the actual trained model
                checkpoint = torch.load(model_path, map_location=self.device)
                self.model = timm.create_model('efficientnet_b0', pretrained=False, num_classes=len(self.class_names))
                state_dict = checkpoint.get('model_state_dict', checkpoint)
                self.model.load_state_dict(state_dict)
                # Attempt to load metadata
                class_names_from_ckpt = checkpoint.get('class_names')
                if isinstance(class_names_from_ckpt, (list, tuple)) and len(class_names_from_ckpt) == len(self.class_names):
                    self.class_names = list(class_names_from_ckpt)
                self.model_val_accuracy = float(checkpoint.get('val_acc')) if 'val_acc' in checkpoint else None
                logger.info(f"Loaded trained {self.current_plant} model from {model_path}")
            
            self.model.to(self.device)
            self.model.eval()
            logger.info(f"Model loaded successfully on {self.device}")
            logger.info(f"Model classes: {self.class_names}")
            if self.model_val_accuracy is not None:
                logger.info(f"Validation accuracy (from checkpoint): {self.model_val_accuracy:.2f}%")
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            # Fallback to pretrained model
            self.model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=len(self.class_names))
            self.model.to(self.device)
            self.model.eval()

    async def switch_plant(self, plant: str, model_path: Optional[str] = None):
        """Switch the active plant model and class mappings."""
        plant_norm = plant.lower().strip()
        if plant_norm not in ("potato", "tomato"):
            raise ValueError("Unsupported plant. Use 'potato' or 'tomato'.")

        self.current_plant = plant_norm

        if plant_norm == 'potato':
            self.class_names = list(self._potato_class_names)
            self.plant_mapping = dict(self._potato_plant_mapping)
            self.disease_mapping = dict(self._potato_disease_mapping)
        else:
            self.class_names = list(self._tomato_class_names)
            self.plant_mapping = dict(self._tomato_plant_mapping)
            self.disease_mapping = dict(self._tomato_disease_mapping)

        # Reload model with appropriate number of classes
        if model_path:
            await self.load_model(model_path)
        else:
            # If no path provided, keep current weights but rebuild head to match classes
            try:
                self.model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=len(self.class_names))
                self.model.to(self.device)
                self.model.eval()
            except Exception:
                # Last resort: keep current model but warn about class mismatch
                logger.warning("Switched plant without loading weights; using generic pretrained head.")

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

                # Optional inversion safeguard for tomato checkpoints with flipped label heads
                if self.current_plant == 'tomato':
                    try:
                        from app.config import settings
                        if getattr(settings, 'TOMATO_INVERT_OUTPUT', False) and probabilities.shape[1] == 2:
                            probabilities = probabilities[:, [1, 0]]
                    except Exception:
                        pass
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
