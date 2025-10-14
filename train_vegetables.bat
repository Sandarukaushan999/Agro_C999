@echo off
echo 🌱 Agro_C Plant Disease Training
echo ================================

set "plant_type=%~1"
if "%plant_type%"=="" (
    echo Usage: train_vegetables.bat [potato^|tomato]
    echo Example: train_vegetables.bat potato
    exit /b 1
)

echo.
echo Checking for %plant_type% images...

if exist "organize_%plant_type%_images.py" (
    python organize_%plant_type%_images.py
)

echo.
echo 📊 Current dataset status:
dir "dataset\healthy\%plant_type%" /b 2>nul | find /c /v "" > temp_healthy.txt
dir "dataset\diseased\%plant_type%" /b 2>nul | find /c /v "" > temp_diseased.txt

set /p healthy_count=<temp_healthy.txt
set /p diseased_count=<temp_diseased.txt

del temp_healthy.txt temp_diseased.txt

echo    Healthy %plant_type% images: %healthy_count%
echo    Diseased %plant_type% images: %diseased_count%

if %healthy_count%==0 (
    echo.
    echo ⚠️  No healthy %plant_type% images found!
    echo Please add healthy %plant_type% leaf images to: dataset\healthy\%plant_type%\
    echo.
    pause
    exit /b 1
)

if %diseased_count%==0 (
    echo.
    echo ⚠️  No diseased %plant_type% images found!
    echo Please add diseased %plant_type% leaf images to: dataset\diseased\%plant_type%\
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Found %healthy_count% healthy and %diseased_count% diseased %plant_type% images!
echo.

set /a total_images=%healthy_count%+%diseased_count%
if %total_images% LSS 10 (
    echo ⚠️  Warning: Only %total_images% images found. Consider adding more images for better training.
    echo Recommended minimum: 20+ images per class
    echo.
)

echo 🚀 Starting model training for %plant_type%...
echo This may take several minutes depending on your hardware...
echo.

python ml_training\train.py %plant_type%

if %errorlevel%==0 (
    echo.
    echo 🎉 Training completed successfully!
    echo.
    echo 📁 Model saved to: ml_training/models/%plant_type%_model_best.pth
    echo 📊 Training history saved to: ml_training/%plant_type%_training_history.png
    echo.
    echo Next steps:
    echo 1. Copy the trained model to ml_service/models/
    echo 2. Start the ML service
    echo 3. Test the model with new %plant_type% images
) else (
    echo.
    echo ❌ Training failed. Please check the error messages above.
)

echo.
pause