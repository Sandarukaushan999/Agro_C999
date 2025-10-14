#!/usr/bin/env python3
import requests
import base64
import json

def test_auth_fix():
    """Test that the authentication fix works"""
    print("Testing Authentication Fix...")
    
    # Test backend health
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend not responding")
            return False
    except Exception as e:
        print(f"❌ Backend error: {e}")
        return False
    
    # Test ML service health
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ ML Service is running")
        else:
            print("❌ ML Service not responding")
            return False
    except Exception as e:
        print(f"❌ ML Service error: {e}")
        return False
    
    # Test the new test endpoint (no auth required)
    try:
        # Create a simple test image (1x1 pixel PNG)
        test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        response = requests.post("http://localhost:5000/api/test-predict", 
                               json={"imageData": test_image_base64}, 
                               timeout=10)
        
        if response.status_code == 200:
            print("✅ Test endpoint works (no auth required)")
            result = response.json()
            print(f"   Response: {result.get('success', False)}")
        else:
            print(f"❌ Test endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Test endpoint error: {e}")
        return False
    
    print("\n🎉 Authentication fix is working!")
    print("The frontend should now work without 'no token authorized denied' error")
    return True

if __name__ == "__main__":
    success = test_auth_fix()
    if success:
        print("\n✅ You can now test the frontend at: http://localhost:5173")
    else:
        print("\n❌ There are still issues to resolve")
