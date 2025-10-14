import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader
import torchvision.transforms as transforms
from PIL import Image
import pandas as pd
import numpy as np
import timm
from pathlib import Path
import json
import argparse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TomatoDiseasePredictor:
    def __init__(self, model_path, class_names):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.class_names = class_names
        self.model = None
        self.load_model(model_path)
        
        # Define transforms for inference
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    def load_model(self, model_path):
        """Load the trained model"""
        try:
            checkpoint = torch.load(model_path, map_location=self.device)
            self.model = timm.create_model('efficientnet_b0', pretrained=False, num_classes=len(self.class_names))
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.to(self.device)
            self.model.eval()
            logger.info(f"Model loaded successfully from {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def predict_single_image(self, image_path):
        """Predict disease for a single image"""
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = F.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
                
                predicted_class = self.class_names[predicted.item()]
                confidence_score = confidence.item()
                
                # Get all class probabilities
                all_probs = probabilities[0].cpu().numpy()
                class_probs = {self.class_names[i]: prob for i, prob in enumerate(all_probs)}
                
                return {
                    'predicted_class': predicted_class,
                    'confidence': confidence_score,
                    'all_probabilities': class_probs
                }
        except Exception as e:
            logger.error(f"Error predicting image {image_path}: {e}")
            return None
    
    def test_on_dataset(self, test_data_path, num_samples=10):
        """Test the model on a subset of the test dataset"""
        logger.info(f"Testing model on {num_samples} samples from test dataset...")
        
        # Load test data
        df = pd.read_csv(test_data_path)
        test_df = df[df['split'] == 'test'].copy()
        
        if len(test_df) == 0:
            logger.warning("No test data found, using validation data instead")
            test_df = df[df['split'] == 'validation'].copy()
        
        # Sample random test images
        test_samples = test_df.sample(n=min(num_samples, len(test_df)), random_state=42)
        
        correct_predictions = 0
        total_predictions = 0
        
        results = []
        
        for idx, row in test_samples.iterrows():
            image_path = row['image_path']
            true_label = row['label']
            
            # Make prediction
            prediction = self.predict_single_image(image_path)
            
            if prediction:
                predicted_class = prediction['predicted_class']
                confidence = prediction['confidence']
                
                is_correct = predicted_class == true_label
                if is_correct:
                    correct_predictions += 1
                total_predictions += 1
                
                results.append({
                    'image_path': image_path,
                    'true_label': true_label,
                    'predicted_class': predicted_class,
                    'confidence': confidence,
                    'correct': is_correct
                })
                
                logger.info(f"Image: {Path(image_path).name}")
                logger.info(f"True: {true_label}, Predicted: {predicted_class}, Confidence: {confidence:.3f}")
                logger.info(f"Correct: {'✓' if is_correct else '✗'}")
                logger.info("-" * 50)
        
        accuracy = correct_predictions / total_predictions if total_predictions > 0 else 0
        logger.info(f"\nTest Results:")
        logger.info(f"Accuracy: {accuracy:.3f} ({correct_predictions}/{total_predictions})")
        
        return results, accuracy

def main():
    parser = argparse.ArgumentParser(description='Test Tomato Disease Classification Model')
    parser.add_argument('--model-path', type=str, default='ml_training/models/tomato/tomato_model_best.pth', 
                       help='Path to trained model')
    parser.add_argument('--test-data', type=str, default='dataset/tomato_labels.csv', 
                       help='Path to test data')
    parser.add_argument('--num-samples', type=int, default=20, 
                       help='Number of test samples to evaluate')
    parser.add_argument('--image-path', type=str, default=None, 
                       help='Path to single image for prediction')
    
    args = parser.parse_args()
    
    # Load model and class names
    model_path = Path(args.model_path)
    if not model_path.exists():
        logger.error(f"Model file not found: {model_path}")
        return
    
    # Load class names from model checkpoint
    checkpoint = torch.load(model_path, map_location='cpu')
    class_names = checkpoint.get('class_names', ['healthy_tomato', 'diseased_tomato'])
    
    # Initialize predictor
    predictor = TomatoDiseasePredictor(model_path, class_names)
    
    if args.image_path:
        # Test single image
        logger.info(f"Testing single image: {args.image_path}")
        result = predictor.predict_single_image(args.image_path)
        if result:
            logger.info(f"Prediction: {result['predicted_class']}")
            logger.info(f"Confidence: {result['confidence']:.3f}")
            logger.info(f"All probabilities: {result['all_probabilities']}")
    else:
        # Test on dataset
        test_data_path = Path(args.test_data)
        if not test_data_path.exists():
            logger.error(f"Test data file not found: {test_data_path}")
            return
        
        results, accuracy = predictor.test_on_dataset(test_data_path, args.num_samples)
        
        # Save results
        results_df = pd.DataFrame(results)
        results_file = 'tomato_test_results.csv'
        results_df.to_csv(results_file, index=False)
        logger.info(f"Test results saved to {results_file}")

if __name__ == '__main__':
    main()
