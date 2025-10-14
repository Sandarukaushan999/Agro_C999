import cv2
import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

def preprocess_image(image_data: bytes) -> np.ndarray:
    """
    Preprocess uploaded image for model inference
    
    Args:
        image_data: Raw image bytes
        
    Returns:
        Preprocessed image as numpy array
    """
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Resize image while maintaining aspect ratio
        target_size = 512
        h, w = image_array.shape[:2]
        
        if h > w:
            new_h = target_size
            new_w = int(w * target_size / h)
        else:
            new_w = target_size
            new_h = int(h * target_size / w)
        
        # Resize image
        resized_image = cv2.resize(image_array, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Pad to square if necessary
        if new_h != new_w:
            max_dim = max(new_h, new_w)
            padded_image = np.zeros((max_dim, max_dim, 3), dtype=np.uint8)
            
            # Center the image
            y_offset = (max_dim - new_h) // 2
            x_offset = (max_dim - new_w) // 2
            padded_image[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized_image
            
            resized_image = padded_image
        
        logger.info(f"Image preprocessed: {resized_image.shape}")
        return resized_image
        
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        raise ValueError(f"Failed to preprocess image: {e}")

def validate_image(image_data: bytes) -> bool:
    """
    Validate uploaded image
    
    Args:
        image_data: Raw image bytes
        
    Returns:
        True if image is valid, False otherwise
    """
    try:
        # Check file size (max 10MB)
        if len(image_data) > 10 * 1024 * 1024:
            return False
        
        # Try to open image
        image = Image.open(io.BytesIO(image_data))
        
        # Check image dimensions
        width, height = image.size
        if width < 50 or height < 50:
            return False
        
        # Check if image is too large
        if width > 5000 or height > 5000:
            return False
        
        return True
        
    except Exception:
        return False
