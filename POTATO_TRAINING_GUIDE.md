# 🥔 Potato Disease Training Guide

## Current Status
✅ Project structure created  
✅ Training pipeline ready  
✅ Dataset directories prepared  
⏳ **Waiting for your potato images**

## 📁 Directory Structure
```
dataset/
├── healthy/
│   └── potato/          ← Add healthy potato leaf images here
└── diseased/
    └── potato/          ← Add diseased potato leaf images here
```

## 🖼️ How to Add Your Potato Images

### Step 1: Prepare Your Images
- **Healthy potato images**: Green, vibrant leaves with no disease signs
- **Diseased potato images**: Leaves with spots, yellowing, blight, or other disease symptoms
- **Supported formats**: .jpg, .jpeg, .png, .bmp, .tiff
- **Recommended size**: At least 224x224 pixels (larger is better)

### Step 2: Copy Images to Correct Folders
1. Copy healthy potato leaf images to: `dataset\healthy\potato\`
2. Copy diseased potato leaf images to: `dataset\diseased\potato\`

### Step 3: Verify Images
Run this command to check your images:
```bash
python organize_potato_images.py
```

## 🚀 Training the Model

### Option 1: Easy Training (Recommended)
```bash
train_potato.bat
```

### Option 2: Manual Training
```bash
python ml_training/train_potato.py
```

## 📊 Training Process
1. **Data Loading**: Images are loaded and preprocessed
2. **Data Augmentation**: Images are rotated, flipped, and enhanced
3. **Model Training**: EfficientNet-B0 model learns to classify healthy vs diseased
4. **Validation**: Model is tested on unseen data
5. **Model Saving**: Best model is saved for use in the application

## 🎯 Expected Results
- **Training Time**: 10-30 minutes (depending on hardware and image count)
- **Model Accuracy**: 80-95% (with sufficient data)
- **Output**: Trained model saved to `ml_training/models/potato_model_best.pth`

## 📈 Monitoring Training
- Training progress is shown in real-time
- Loss and accuracy graphs are generated
- Best model is automatically saved

## 🔧 Troubleshooting

### Not Enough Images
- **Minimum**: 10 images per class (healthy/diseased)
- **Recommended**: 20+ images per class
- **Optimal**: 50+ images per class

### Training Errors
- Check image formats (must be valid image files)
- Ensure images are not corrupted
- Verify directory structure

### Low Accuracy
- Add more diverse images
- Ensure good quality images
- Check for balanced dataset (similar number of healthy/diseased)

## 🎉 After Training
1. Model will be saved to `ml_training/models/potato_model_best.pth`
2. Copy model to `ml_service/models/` for use in the application
3. Start the ML service to test predictions
4. Upload new potato images to test the trained model

## 📝 Next Steps
1. **Add your potato images** to the dataset folders
2. **Run the training script** to train the model
3. **Test the model** with new images
4. **Add more plant types** (tomato, corn, etc.) for expanded functionality

---

**Ready to start? Add your potato images and run `train_potato.bat`!**






