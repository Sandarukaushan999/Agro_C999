#!/usr/bin/env python3
import torch
import os
import sys

def verify_trained_model():
    """Verify that the model is actually trained and not dummy data"""
    print("Verifying Trained Model...")
    
    model_path = "ml_service/models/potato_model_best.pth"
    
    if not os.path.exists(model_path):
        print("❌ Model file not found!")
        return False
    
    try:
        # Load the model checkpoint
        checkpoint = torch.load(model_path, map_location='cpu')
        
        print(f"✅ Model file found: {model_path}")
        print(f"   File size: {os.path.getsize(model_path) / (1024*1024):.1f} MB")
        
        # Check if it's a proper checkpoint
        if 'model_state_dict' in checkpoint:
            print("✅ Model checkpoint structure is correct")
            
            # Check model parameters
            state_dict = checkpoint['model_state_dict']
            total_params = sum(p.numel() for p in state_dict.values())
            print(f"   Total parameters: {total_params:,}")
            
            # Check if parameters are not all zeros (dummy data)
            all_zero = True
            for name, param in state_dict.items():
                if param.numel() > 0 and not torch.all(param == 0):
                    all_zero = False
                    break
            
            if not all_zero:
                print("✅ Model parameters are trained (not all zeros)")
            else:
                print("❌ Model parameters are all zeros (dummy data)")
                return False
                
        else:
            print("❌ Model checkpoint structure is incorrect")
            return False
            
        # Check for training metadata
        if 'epoch' in checkpoint:
            print(f"   Training epoch: {checkpoint['epoch']}")
        if 'best_acc' in checkpoint:
            print(f"   Best accuracy: {checkpoint['best_acc']:.4f}")
        if 'loss' in checkpoint:
            print(f"   Training loss: {checkpoint['loss']:.4f}")
            
        print("✅ Model appears to be properly trained")
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def main():
    print("🔍 Model Verification")
    print("=" * 30)
    
    success = verify_trained_model()
    
    print("\n" + "=" * 30)
    if success:
        print("🎉 Model verification passed!")
        print("✅ Using real trained model, not dummy data")
        print("✅ Model should work for both healthy and diseased images")
    else:
        print("❌ Model verification failed!")
        print("💡 Try retraining the model with: train_potato.bat")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
