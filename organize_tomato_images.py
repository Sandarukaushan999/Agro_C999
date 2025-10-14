import os
import shutil
from pathlib import Path

def organize_tomato_images():
    """Organize tomato images into healthy and diseased categories"""
    # Create directory structure if it doesn't exist
    dataset_path = Path("dataset")
    healthy_path = dataset_path / "healthy" / "tomato"
    diseased_path = dataset_path / "diseased" / "tomato"
    
    healthy_path.mkdir(parents=True, exist_ok=True)
    diseased_path.mkdir(parents=True, exist_ok=True)
    
    print("✅ Created dataset directory structure")
    
    # Check for existing files
    healthy_count = len(list(healthy_path.glob("*")))
    diseased_count = len(list(diseased_path.glob("*")))
    
    if healthy_count > 0 or diseased_count > 0:
        print(f"\nℹ️ Found existing images:")
        print(f"   Healthy tomato images: {healthy_count}")
        print(f"   Diseased tomato images: {diseased_count}")
    
    print("\n📋 Instructions for adding tomato images:")
    print("1. Place healthy tomato leaf images in:")
    print(f"   {healthy_path}")
    print("\n2. Place diseased tomato leaf images in:")
    print(f"   {diseased_path}")
    print("\n3. Supported image formats: .jpg, .jpeg, .png")

if __name__ == "__main__":
    organize_tomato_images()