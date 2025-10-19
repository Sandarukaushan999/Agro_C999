import numpy as np
from PIL import Image, ImageOps
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

        # Normalize EXIF orientation and convert to RGB
        image = ImageOps.exif_transpose(image)
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Do not resize here; model's transform handles resize/normalize deterministically
        image_array = np.array(image)

        logger.info(f"Image preprocessed: {image_array.shape}")
        return image_array
        
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
