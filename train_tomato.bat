@echo off
echo Starting Tomato Disease Classification Training...
echo.

REM Activate virtual environment
call ml_training\venv\Scripts\activate.bat

REM Create tomato labels if they don't exist
if not exist "dataset\tomato_labels.csv" (
    echo Creating tomato labels...
    python create_tomato_labels.py
    echo.
)

REM Start training
echo Starting tomato model training...
python train_tomato.py --dataset-path dataset --output-dir ml_training\models\tomato --epochs 50 --batch-size 32 --learning-rate 0.001

echo.
echo Training completed!
pause
