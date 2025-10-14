@echo off
echo 🔧 Setting up Agro_C Environment...
echo ====================================

REM Create backend .env file
echo Creating backend environment file...
(
echo # Backend Environment Configuration
echo NODE_ENV=development
echo PORT=5000
echo FRONTEND_URL=http://localhost:5173
echo.
echo # Database Configuration
echo MONGO_URI=mongodb://localhost:27017/agro_c
echo.
echo # JWT Configuration
echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
echo JWT_EXPIRE=7d
echo.
echo # ML Service Configuration
echo ML_SERVICE_URL=http://localhost:8000
echo.
echo # File Upload Configuration
echo MAX_FILE_SIZE=10485760
echo UPLOAD_PATH=uploads
echo.
echo # Logging Configuration
echo LOG_LEVEL=info
) > backend\.env

REM Create ML service .env file
echo Creating ML service environment file...
(
echo # ML Service Environment Configuration
echo MODEL_PATH=models/potato_model_best.pth
echo DATASET_PATH=dataset
echo MLFLOW_TRACKING_URI=http://localhost:5000
echo LOG_LEVEL=INFO
echo.
echo # Service Configuration
echo HOST=0.0.0.0
echo PORT=8000
) > ml_service\.env

REM Create frontend .env file
echo Creating frontend environment file...
(
echo # Frontend Environment Configuration
echo VITE_API_URL=http://localhost:5000
echo VITE_ML_SERVICE_URL=http://localhost:8000
echo VITE_APP_NAME=Agro_C
echo VITE_APP_VERSION=1.0.0
) > frontend\.env

echo.
echo ✅ Environment files created successfully!
echo.
echo 📁 Created files:
echo    - backend\.env
echo    - ml_service\.env
echo    - frontend\.env
echo.
echo 🚀 Now you can run: start_agro_c.bat
echo.
pause
