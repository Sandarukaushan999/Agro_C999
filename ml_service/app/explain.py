import torch
import cv2
import numpy as np
from PIL import Image
import os
import uuid
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def generate_gradcam_explanation(model, image: np.ndarray, class_idx: int) -> Optional[str]:
    """
    Generate Grad-CAM explanation for the prediction
    
    Args:
        model: Trained PyTorch model
        image: Input image as numpy array
        class_idx: Predicted class index
        
    Returns:
        Path to generated explanation image or None if failed
    """
    try:
        # Import torchcam here to avoid import issues if not available
        from torchcam.methods import GradCAM
        from torchvision import transforms
        
        # Create GradCAM extractor - try different layer names
        target_layers = ['blocks.6.0', 'blocks.5.0', 'blocks.4.0', 'classifier', 'head']
        extractor = None
        
        for layer_name in target_layers:
            try:
                extractor = GradCAM(model, target_layer=layer_name)
                logger.info(f"Using GradCAM layer: {layer_name}")
                break
            except Exception as e:
                logger.debug(f"Failed to use layer {layer_name}: {e}")
                continue
        
        if extractor is None:
            logger.warning("Could not find suitable layer for GradCAM")
            return None
        
        # Preprocess image for model
        transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Convert numpy array to PIL Image if needed
        if isinstance(image, np.ndarray):
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8)
            image = Image.fromarray(image)
        
        # Apply transforms
        input_tensor = transform(image).unsqueeze(0)
        
        # Generate GradCAM - need gradients enabled
        model.train()  # Enable gradients for GradCAM
        input_tensor.requires_grad_(True)  # Enable gradients on input
        
        # Forward pass
        outputs = model(input_tensor)
        
        # Generate CAM
        cam = extractor(class_idx, outputs)
        
        # Reset model to eval mode
        model.eval()
        
        # Convert CAM to numpy array
        cam_array = cam[0].cpu().numpy()
        
        # Resize CAM to original image size
        original_size = image.size
        cam_resized = cv2.resize(cam_array, original_size)
        
        # Normalize CAM
        cam_normalized = (cam_resized - cam_resized.min()) / (cam_resized.max() - cam_resized.min())
        
        # Convert original image to numpy array
        original_array = np.array(image)
        
        # Create heatmap overlay
        heatmap = cv2.applyColorMap((cam_normalized * 255).astype(np.uint8), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Blend original image with heatmap
        alpha = 0.4
        explanation_image = cv2.addWeighted(original_array, 1-alpha, heatmap, alpha, 0)
        
        # Save explanation image
        explanation_dir = "explanations"
        os.makedirs(explanation_dir, exist_ok=True)
        
        explanation_filename = f"explanation_{uuid.uuid4().hex}.jpg"
        explanation_path = os.path.join(explanation_dir, explanation_filename)
        
        # Save as JPEG
        explanation_pil = Image.fromarray(explanation_image)
        explanation_pil.save(explanation_path, quality=90)
        
        logger.info(f"GradCAM explanation saved: {explanation_path}")
        return explanation_path
            
    except ImportError:
        logger.warning("torchcam not available, skipping GradCAM generation")
        return None
    except Exception as e:
        logger.error(f"GradCAM generation error: {e}")
        return None

def create_simple_explanation(image: np.ndarray, prediction: str, confidence: float) -> str:
    """
    Create a simple explanation image with text overlay
    
    Args:
        image: Input image as numpy array
        prediction: Prediction result
        confidence: Confidence score
        
    Returns:
        Path to generated explanation image
    """
    try:
        # Convert to PIL Image if needed
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        
        # Create explanation text
        text = f"Prediction: {prediction}\nConfidence: {confidence:.2f}"
        
        # Create a copy of the image for overlay
        explanation_image = image.copy()
        
        # Add text overlay (simplified version)
        # In a real implementation, you would use PIL's ImageDraw
        
        # Save explanation image
        explanation_dir = "explanations"
        os.makedirs(explanation_dir, exist_ok=True)
        
        explanation_filename = f"simple_explanation_{uuid.uuid4().hex}.jpg"
        explanation_path = os.path.join(explanation_dir, explanation_filename)
        
        explanation_image.save(explanation_path, quality=90)
        
        logger.info(f"Simple explanation saved: {explanation_path}")
        return explanation_path
        
    except Exception as e:
        logger.error(f"Simple explanation generation error: {e}")
        return None
