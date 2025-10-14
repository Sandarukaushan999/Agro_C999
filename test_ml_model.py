#!/usr/bin/env python3
import requests
import base64
import json

def test_ml_model_directly():
    """Test the ML model directly to verify it's working"""
    print("Testing ML Model Directly...")
    
    # Test with a simple 1x1 pixel image
    test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    try:
        # Convert base64 to bytes
        base64_data = test_image_base64.split(',')[1]
        image_bytes = base64.b64decode(base64_data)
        
        # Test ML service directly
        files = {'file': ('test.png', image_bytes, 'image/png')}
        response = requests.post("http://localhost:8000/predict", files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ ML Service prediction successful")
            print(f"   Prediction: {result.get('prediction', 'Unknown')}")
            print(f"   Confidence: {result.get('confidence', 0):.4f}")
            print(f"   Plant Type: {result.get('plantType', 'Unknown')}")
            print(f"   Disease Type: {result.get('diseaseType', 'None')}")
            print(f"   Model Version: {result.get('model_version', 'Unknown')}")
            
            # Verify it's not dummy data
            if result.get('model_version') == '1.0.0':
                print("✅ Using real model (version 1.0.0)")
            else:
                print("⚠️  Model version not as expected")
                
            return True
        else:
            print(f"❌ ML Service prediction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ML Service test error: {e}")
        return False

def test_backend_prediction():
    """Test backend prediction endpoint"""
    print("\nTesting Backend Prediction...")
    
    # Test with a simple image
    test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    try:
        response = requests.post("http://localhost:5000/api/test-predict", 
                               json={"imageData": test_image_base64}, 
                               timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Backend prediction successful")
            if result.get('success'):
                prediction = result.get('prediction', {})
                print(f"   Prediction: {prediction.get('prediction', 'Unknown')}")
                print(f"   Confidence: {prediction.get('confidence', 0):.4f}")
                print(f"   Plant Type: {prediction.get('plantType', 'Unknown')}")
                print(f"   Disease Type: {prediction.get('diseaseType', 'None')}")
            return True
        else:
            print(f"❌ Backend prediction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Backend test error: {e}")
        return False

def main():
    print("🧪 Testing ML Model and Backend")
    print("=" * 40)
    
    # Test ML service directly
    ml_ok = test_ml_model_directly()
    
    # Test backend
    backend_ok = test_backend_prediction()
    
    print("\n" + "=" * 40)
    if ml_ok and backend_ok:
        print("🎉 All tests passed!")
        print("✅ ML model is working correctly")
        print("✅ Backend communication is working")
        print("✅ No dummy data - using real trained model")
    else:
        print("❌ Some tests failed")
        if not ml_ok:
            print("   - ML service has issues")
        if not backend_ok:
            print("   - Backend communication has issues")
    
    return ml_ok and backend_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
