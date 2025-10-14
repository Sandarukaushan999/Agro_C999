import os
import shutil
from pathlib import Path

def organize_potato_images():
    """Help organize potato images into the correct directory structure"""
    
    print("🥔 Potato Image Organizer for Agro_C")
    print("=" * 50)
    
    # Define paths
    healthy_dir = Path("dataset/healthy/potato")
    diseased_dir = Path("dataset/diseased/potato")
    
    # Create directories if they don't exist
    healthy_dir.mkdir(parents=True, exist_ok=True)
    diseased_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📁 Healthy potato images directory: {healthy_dir}")
    print(f"📁 Diseased potato images directory: {diseased_dir}")
    
    # Check current contents
    healthy_count = len(list(healthy_dir.glob("*")))
    diseased_count = len(list(diseased_dir.glob("*")))
    
    print(f"\n📊 Current image counts:")
    print(f"   Healthy potato images: {healthy_count}")
    print(f"   Diseased potato images: {diseased_count}")
    
    if healthy_count == 0 and diseased_count == 0:
        print("\n⚠️  No images found!")
        print("\n📝 Instructions:")
        print("1. Add your healthy potato leaf images to: dataset/healthy/potato/")
        print("2. Add your diseased potato leaf images to: dataset/diseased/potato/")
        print("3. Supported formats: .jpg, .jpeg, .png, .bmp, .tiff")
        print("4. Run this script again after adding images")
        
        # Create example files
        create_example_structure()
    else:
        print(f"\n✅ Found {healthy_count + diseased_count} potato images!")
        print("\n🚀 Ready to train the model!")
        print("Run: python ml_training/train_potato.py")

def create_example_structure():
    """Create example directory structure and instructions"""
    
    print("\n📋 Creating example structure...")
    
    # Create README files
    healthy_readme = Path("dataset/healthy/potato/README.txt")
    diseased_readme = Path("dataset/diseased/potato/README.txt")
    
    healthy_readme.write_text("""
HEALTHY POTATO IMAGES

Place your healthy potato leaf images here.

Supported formats: .jpg, .jpeg, .png, .bmp, .tiff

Examples of healthy potato leaves:
- Green, vibrant leaves
- No spots or discoloration
- Normal leaf shape and size
- No signs of disease or damage

Minimum recommended: 20+ images for good training
""")
    
    diseased_readme.write_text("""
DISEASED POTATO IMAGES

Place your diseased potato leaf images here.

Supported formats: .jpg, .jpeg, .png, .bmp, .tiff

Examples of diseased potato leaves:
- Spots or lesions on leaves
- Yellowing or browning
- Wilting or curling
- Signs of blight, scab, or other diseases

Minimum recommended: 20+ images for good training
""")
    
    print("✅ Created README files with instructions")

if __name__ == "__main__":
    organize_potato_images()

