#!/usr/bin/env python3
import requests
import json
import sys
import os

def test_ml_service():
    """Test the ML service directly"""
    print("Testing ML Service...")
    
    # Test health endpoint
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ ML Service health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ ML Service health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ML Service not responding: {e}")
        return False
    
    # Test model info endpoint
    try:
        response = requests.get("http://localhost:8000/model/info", timeout=5)
        if response.status_code == 200:
            print("✅ ML Service model info retrieved")
            model_info = response.json()
            print(f"   Model: {model_info.get('model_name', 'Unknown')}")
            print(f"   Classes: {model_info.get('class_names', [])}")
        else:
            print(f"❌ ML Service model info failed: {response.status_code}")
    except Exception as e:
        print(f"❌ ML Service model info error: {e}")
    
    return True

def test_backend():
    """Test the backend service"""
    print("\nTesting Backend...")
    
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check passed")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not responding: {e}")
        return False

def main():
    print("🧪 Agro_C System Test")
    print("=" * 30)
    
    # Test ML service
    ml_ok = test_ml_service()
    
    # Test backend
    backend_ok = test_backend()
    
    print("\n" + "=" * 30)
    if ml_ok and backend_ok:
        print("✅ All services are working!")
        print("🌐 You can now visit: http://localhost:5173")
    else:
        print("❌ Some services are not working")
        if not ml_ok:
            print("   - ML Service needs to be started")
        if not backend_ok:
            print("   - Backend needs to be started")
    
    return ml_ok and backend_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
