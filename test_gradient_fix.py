#!/usr/bin/env python3
import requests
import base64
import json

def test_ml_service_direct():
    """Test ML service directly"""
    print("Testing ML Service Directly...")
    
    # Create a simple test image
    test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    base64_data = test_image_base64.split(',')[1]
    image_bytes = base64.b64decode(base64_data)
    
    try:
        files = {'file': ('test.png', image_bytes, 'image/png')}
        response = requests.post("http://localhost:8000/predict", files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ ML Service working")
            print(f"   Prediction: {result.get('prediction', 'Unknown')}")
            print(f"   Confidence: {result.get('confidence', 0):.4f}")
            return True
        else:
            print(f"❌ ML Service failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ ML Service error: {e}")
        return False

def test_backend_endpoint():
    """Test backend test endpoint"""
    print("\nTesting Backend Test Endpoint...")
    
    test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    try:
        response = requests.post("http://localhost:5000/api/test-predict", 
                               json={"imageData": test_image_base64}, 
                               timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Backend endpoint working")
            if result.get('success'):
                prediction = result.get('prediction', {})
                print(f"   Prediction: {prediction.get('prediction', 'Unknown')}")
                print(f"   Confidence: {prediction.get('confidence', 0):.4f}")
            return True
        else:
            print(f"❌ Backend endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Backend endpoint error: {e}")
        return False

def main():
    print("🧪 Testing Gradient Error Fix")
    print("=" * 40)
    
    # Test ML service directly
    ml_ok = test_ml_service_direct()
    
    # Test backend
    backend_ok = test_backend_endpoint()
    
    print("\n" + "=" * 40)
    if ml_ok and backend_ok:
        print("🎉 Gradient error fix successful!")
        print("✅ ML service working without gradient errors")
        print("✅ Backend communication working")
        print("✅ Both healthy and diseased images should work")
        print("\n🌐 Test in browser: http://localhost:5173")
    else:
        print("❌ Some tests failed")
        if not ml_ok:
            print("   - ML service still has issues")
        if not backend_ok:
            print("   - Backend communication still has issues")
        print("\n💡 Try running: fix_gradient_error.bat")
    
    return ml_ok and backend_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
