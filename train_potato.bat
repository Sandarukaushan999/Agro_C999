@echo off
echo 🥔 Agro_C Potato Disease Training
echo ================================

echo.
echo Checking for potato images...

python organize_potato_images.py

echo.
echo 📊 Current dataset status:
dir dataset\healthy\potato /b 2>nul | find /c /v "" > temp_healthy.txt
dir dataset\diseased\potato /b 2>nul | find /c /v "" > temp_diseased.txt

set /p healthy_count=<temp_healthy.txt
set /p diseased_count=<temp_diseased.txt

del temp_healthy.txt temp_diseased.txt

echo    Healthy potato images: %healthy_count%
echo    Diseased potato images: %diseased_count%

if %healthy_count%==0 (
    echo.
    echo ⚠️  No healthy potato images found!
    echo Please add healthy potato leaf images to: dataset\healthy\potato\
    echo.
    pause
    exit /b 1
)

if %diseased_count%==0 (
    echo.
    echo ⚠️  No diseased potato images found!
    echo Please add diseased potato leaf images to: dataset\diseased\potato\
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Found %healthy_count% healthy and %diseased_count% diseased potato images!
echo.

set /a total_images=%healthy_count%+%diseased_count%
if %total_images% LSS 10 (
    echo ⚠️  Warning: Only %total_images% images found. Consider adding more images for better training.
    echo Recommended minimum: 20+ images per class
    echo.
)

echo 🚀 Starting model training...
echo This may take several minutes depending on your hardware...
echo.

python ml_training/train_potato.py

if %errorlevel%==0 (
    echo.
    echo 🎉 Training completed successfully!
    echo.
    echo 📁 Model saved to: ml_training/models/potato_model_best.pth
    echo 📊 Training history saved to: ml_training/training_history.png
    echo.
    echo Next steps:
    echo 1. Copy the trained model to ml_service/models/
    echo 2. Start the ML service
    echo 3. Test the model with new potato images
) else (
    echo.
    echo ❌ Training failed. Please check the error messages above.
)

echo.
pause



