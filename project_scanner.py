import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def scan_project():
    """Scan the complete Agro_C project"""
    print("🔍 Agro_C Project Scanner")
    print("=" * 50)
    
    # Check project structure
    print("\n📁 Project Structure:")
    required_dirs = ['backend', 'frontend', 'ml_service', 'ml_training', 'dataset', 'infra']
    for dir_name in required_dirs:
        if os.path.exists(dir_name):
            print(f"   ✅ {dir_name}/")
        else:
            print(f"   ❌ {dir_name}/ - MISSING")
    
    # Check dataset
    print("\n📊 Dataset Status:")
    healthy_dir = Path("dataset/healthy/potato")
    diseased_dir = Path("dataset/diseased/potato")
    
    if healthy_dir.exists():
        healthy_count = len([f for f in healthy_dir.glob("*.JPG")])
        print(f"   ✅ Healthy potato images: {healthy_count}")
    else:
        print("   ❌ Healthy potato directory not found")
        healthy_count = 0
    
    if diseased_dir.exists():
        diseased_count = len([f for f in diseased_dir.glob("*.JPG")])
        print(f"   ✅ Diseased potato images: {diseased_count}")
    else:
        print("   ❌ Diseased potato directory not found")
        diseased_count = 0
    
    total_images = healthy_count + diseased_count
    print(f"   📈 Total images: {total_images}")
    
    # Check trained model
    print("\n🤖 Model Status:")
    model_path = Path("ml_service/models/potato_model_best.pth")
    if model_path.exists():
        size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"   ✅ Trained model found: {size_mb:.1f} MB")
    else:
        print("   ❌ Trained model not found!")
    
    # Check dependencies
    print("\n📦 Dependencies:")
    
    # Backend
    if os.path.exists("backend/node_modules"):
        print("   ✅ Backend dependencies installed")
    else:
        print("   ⚠️  Backend dependencies missing")
    
    # Frontend
    if os.path.exists("frontend/node_modules"):
        print("   ✅ Frontend dependencies installed")
    else:
        print("   ⚠️  Frontend dependencies missing")
    
    # ML Service
    if os.path.exists("ml_service/venv"):
        print("   ✅ ML Service Python environment ready")
    else:
        print("   ⚠️  ML Service environment missing")
    
    return total_images > 0 and model_path.exists()

def start_services():
    """Start all required services"""
    print("\n🚀 Starting Services...")
    
    # Start database
    print("\n[1/4] Starting Database & Storage...")
    try:
        os.chdir("infra")
        subprocess.Popen(["docker-compose", "-f", "docker-compose-simple.yml", "up", "-d"], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.chdir("..")
        print("   ✅ Database services started")
    except Exception as e:
        print(f"   ⚠️  Database start failed: {e}")
    
    time.sleep(5)
    
    # Start ML Service
    print("\n[2/4] Starting ML Service...")
    try:
        os.chdir("ml_service")
        subprocess.Popen(["python", "main.py"], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.chdir("..")
        print("   ✅ ML Service started")
    except Exception as e:
        print(f"   ⚠️  ML Service start failed: {e}")
    
    time.sleep(10)
    
    # Start Backend
    print("\n[3/4] Starting Backend API...")
    try:
        os.chdir("backend")
        subprocess.Popen(["npm", "start"], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.chdir("..")
        print("   ✅ Backend API started")
    except Exception as e:
        print(f"   ⚠️  Backend start failed: {e}")
    
    time.sleep(5)
    
    # Start Frontend
    print("\n[4/4] Starting Frontend...")
    try:
        os.chdir("frontend")
        subprocess.Popen(["npm", "run", "dev"], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.chdir("..")
        print("   ✅ Frontend started")
    except Exception as e:
        print(f"   ⚠️  Frontend start failed: {e}")

def test_services():
    """Test if services are running"""
    print("\n🧪 Testing Services...")
    
    services = [
        ("ML Service", "http://localhost:8000/health"),
        ("Backend API", "http://localhost:5000/health"),
        ("Frontend", "http://localhost:5173")
    ]
    
    for name, url in services:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"   ✅ {name} is running")
            else:
                print(f"   ⚠️  {name} responded with status {response.status_code}")
        except requests.exceptions.RequestException:
            print(f"   ❌ {name} is not responding")

def main():
    """Main function"""
    print("🥔 Agro_C Complete Project Scanner & Startup")
    print("=" * 60)
    
    # Scan project
    project_ready = scan_project()
    
    if not project_ready:
        print("\n❌ Project is not ready. Please check the issues above.")
        return
    
    print("\n✅ Project is ready!")
    
    # Start services
    start_services()
    
    print("\n⏳ Waiting for services to initialize...")
    time.sleep(15)
    
    # Test services
    test_services()
    
    print("\n🎉 Agro_C is ready!")
    print("\n🌐 Access Points:")
    print("   - Frontend: http://localhost:5173")
    print("   - Backend API: http://localhost:5000")
    print("   - ML Service: http://localhost:8000")
    print("\n🥔 Upload potato images to test your trained model!")

if __name__ == "__main__":
    main()




