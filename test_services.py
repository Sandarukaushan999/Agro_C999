#!/usr/bin/env python3
"""
Test script to check if all services are running
"""
import requests
import time
import subprocess
import sys

def test_service(url, name, timeout=5):
    """Test if a service is running"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            print(f"[OK] {name} is running at {url}")
            return True
        else:
            print(f"[ERROR] {name} returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] {name} is not running: {e}")
        return False

def main():
    print("Testing Agro_C Services...")
    print("=" * 50)
    
    services = [
        ("http://localhost:8000/health", "ML Service"),
        ("http://localhost:5000/health", "Backend API"),
        ("http://localhost:5173", "Frontend"),
    ]
    
    running_services = 0
    total_services = len(services)
    
    for url, name in services:
        if test_service(url, name):
            running_services += 1
        time.sleep(1)
    
    print("=" * 50)
    print(f"Status: {running_services}/{total_services} services running")
    
    if running_services == total_services:
        print("All services are running successfully!")
        print("\nAccess Points:")
        print("   Frontend: http://localhost:5173")
        print("   Backend:  http://localhost:5000")
        print("   ML Service: http://localhost:8000")
    else:
        print("Some services are not running. Check the logs above.")
    
    return running_services == total_services

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)