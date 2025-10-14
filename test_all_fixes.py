#!/usr/bin/env python3
import requests
import json
import base64

def test_ml_service():
    """Test ML service health"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ ML Service is healthy")
            return True
        else:
            print(f"❌ ML Service health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ML Service not responding: {e}")
        return False

def test_backend_health():
    """Test backend health"""
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not responding: {e}")
        return False

def test_solutions_endpoint():
    """Test solutions endpoint"""
    try:
        response = requests.get("http://localhost:5000/api/solutions/potato/unknown_disease", timeout=5)
        if response.status_code == 200:
            print("✅ Solutions endpoint working")
            data = response.json()
            if data.get('success'):
                print(f"   Found solution: {data.get('solution', {}).get('title', 'Unknown')}")
            return True
        elif response.status_code == 404:
            print("⚠️  Solutions endpoint working (no solution found - expected)")
            return True
        else:
            print(f"❌ Solutions endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Solutions endpoint error: {e}")
        return False

def test_prediction_endpoint():
    """Test prediction endpoint with a simple image"""
    try:
        # Create a simple 1x1 pixel PNG image in base64
        test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        response = requests.post("http://localhost:5000/api/test-predict", 
                               json={"imageData": test_image}, 
                               timeout=10)
        
        if response.status_code == 200:
            print("✅ Prediction endpoint working")
            data = response.json()
            if data.get('success'):
                prediction = data.get('prediction', {})
                print(f"   Prediction: {prediction.get('prediction', 'Unknown')}")
                print(f"   Confidence: {prediction.get('confidence', 0):.2f}")
            return True
        else:
            print(f"❌ Prediction endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Prediction endpoint error: {e}")
        return False

def main():
    print("🧪 Testing All System Fixes")
    print("=" * 40)
    
    tests = [
        ("ML Service Health", test_ml_service),
        ("Backend Health", test_backend_health),
        ("Solutions Endpoint", test_solutions_endpoint),
        ("Prediction Endpoint", test_prediction_endpoint),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 40)
    print("📊 Test Results:")
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 40)
    if all_passed:
        print("🎉 All tests passed! System is working correctly.")
        print("🌐 You can now test the frontend at: http://localhost:5173")
        print("📝 Expected behavior:")
        print("   - No 500 Internal Server Errors")
        print("   - No React Router deprecation warnings")
        print("   - Image upload and analysis should work")
    else:
        print("❌ Some tests failed. Check the errors above.")
        print("💡 Try running: fix_all_errors.bat")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
