import requests
import json
from PIL import Image
import io
import os

def test_potato_model():
    """Test the trained potato model with sample images"""
    
    print("🥔 Testing Trained Potato Model")
    print("=" * 40)
    
    # ML Service URL
    ml_url = "http://localhost:8000"
    
    # Test if ML service is running
    try:
        response = requests.get(f"{ml_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ ML Service is running")
            health_data = response.json()
            print(f"   Model loaded: {health_data.get('model_loaded', False)}")
        else:
            print("❌ ML Service not responding properly")
            return
    except requests.exceptions.RequestException:
        print("❌ ML Service not running. Please start it first.")
        print("   Run: start_agro_c.bat")
        return
    
    # Test with sample images
    test_images = []
    
    # Look for sample images in the dataset
    healthy_dir = "dataset/healthy/potato"
    diseased_dir = "dataset/diseased/potato"
    
    if os.path.exists(healthy_dir):
        healthy_files = [f for f in os.listdir(healthy_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if healthy_files:
            test_images.append(("healthy", os.path.join(healthy_dir, healthy_files[0])))
    
    if os.path.exists(diseased_dir):
        diseased_files = [f for f in os.listdir(diseased_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if diseased_files:
            test_images.append(("diseased", os.path.join(diseased_dir, diseased_files[0])))
    
    if not test_images:
        print("❌ No test images found in dataset directories")
        return
    
    print(f"\n🧪 Testing with {len(test_images)} sample images...")
    
    for expected_class, image_path in test_images:
        try:
            print(f"\n📸 Testing: {os.path.basename(image_path)} (expected: {expected_class})")
            
            # Load and prepare image
            with open(image_path, 'rb') as f:
                files = {'image': f}
                
                # Send prediction request
                response = requests.post(f"{ml_url}/predict", files=files, timeout=30)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    prediction = result.get('prediction', 'unknown')
                    confidence = result.get('confidence', 0)
                    plant_type = result.get('plantType', 'unknown')
                    disease_type = result.get('diseaseType', 'unknown')
                    
                    print(f"   Prediction: {prediction}")
                    print(f"   Confidence: {confidence:.2%}")
                    print(f"   Plant Type: {plant_type}")
                    print(f"   Disease Type: {disease_type}")
                    
                    # Check if prediction matches expected
                    if expected_class == "healthy" and prediction == "healthy":
                        print("   ✅ CORRECT - Healthy potato detected")
                    elif expected_class == "diseased" and prediction == "diseased":
                        print("   ✅ CORRECT - Diseased potato detected")
                    else:
                        print(f"   ⚠️  MISMATCH - Expected {expected_class}, got {prediction}")
                        
                else:
                    print(f"   ❌ Error: {response.status_code} - {response.text}")
                    
        except Exception as e:
            print(f"   ❌ Error testing {image_path}: {e}")
    
    print(f"\n🎉 Model testing completed!")
    print(f"🌐 You can now use the web interface at: http://localhost:5173")

if __name__ == "__main__":
    test_potato_model()




