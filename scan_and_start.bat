@echo off
echo 🔍 Agro_C Project Scanner & Startup
echo ===================================

echo.
echo 📊 Project Status Check:
echo.

REM Check if we're in the right directory
if not exist "dataset\healthy\potato" (
    echo ❌ Dataset directory not found. Please run from C_Agro root directory.
    pause
    exit /b 1
)

echo ✅ Project structure found

REM Check dataset
echo.
echo 📁 Dataset Status:
dir dataset\healthy\potato /b 2>nul | find /c ".JPG" > temp_healthy.txt
dir dataset\diseased\potato /b 2>nul | find /c ".JPG" > temp_diseased.txt

set /p healthy_count=<temp_healthy.txt
set /p diseased_count=<temp_diseased.txt

del temp_healthy.txt temp_diseased.txt

echo    Healthy potato images: %healthy_count%
echo    Diseased potato images: %diseased_count%

if %healthy_count%==0 (
    echo ❌ No healthy potato images found!
    pause
    exit /b 1
)

if %diseased_count%==0 (
    echo ❌ No diseased potato images found!
    pause
    exit /b 1
)

echo ✅ Dataset ready (%healthy_count% + %diseased_count% = %healthy_count%+%diseased_count% images)

REM Check trained model
echo.
echo 🤖 Model Status:
if exist "ml_service\models\potato_model_best.pth" (
    echo ✅ Trained model found
    for %%A in ("ml_service\models\potato_model_best.pth") do echo    Size: %%~zA bytes
) else (
    echo ❌ Trained model not found!
    pause
    exit /b 1
)

REM Check dependencies
echo.
echo 📦 Dependencies Check:
if exist "backend\node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️  Backend dependencies not installed. Installing...
    cd backend
    call npm install
    cd ..
)

if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ⚠️  Frontend dependencies not installed. Installing...
    cd frontend
    call npm install
    cd ..
)

if exist "ml_service\venv" (
    echo ✅ ML Service Python environment ready
) else (
    echo ⚠️  ML Service environment not found. Creating...
    cd ml_service
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

echo.
echo 🚀 Starting All Services...
echo.

REM Start MongoDB and MinIO
echo [1/4] Starting Database & Storage...
cd infra
start "Database & Storage" cmd /k "docker-compose -f docker-compose-simple.yml up"
cd ..

REM Wait for database to start
echo    Waiting for database to initialize...
timeout /t 10 /nobreak >nul

REM Start ML Service
echo [2/4] Starting ML Service...
cd ml_service
start "ML Service" cmd /k "venv\Scripts\activate && python main.py"
cd ..

REM Wait for ML service
echo    Waiting for ML service to load model...
timeout /t 15 /nobreak >nul

REM Start Backend
echo [3/4] Starting Backend API...
cd backend
start "Backend API" cmd /k "npm start"
cd ..

REM Wait for backend
echo    Waiting for backend to start...
timeout /t 10 /nobreak >nul

REM Start Frontend
echo [4/4] Starting Frontend...
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ All services started!
echo.
echo 🌐 Access Points:
echo    - Frontend: http://localhost:5173
echo    - Backend API: http://localhost:5000
echo    - ML Service: http://localhost:8000
echo    - MongoDB: localhost:27017
echo    - MinIO: http://localhost:9000
echo.

REM Test the model
echo 🧪 Testing Trained Model...
timeout /t 5 /nobreak >nul

python test_potato_model.py

echo.
echo 🎉 Agro_C is ready for testing!
echo Upload potato images at: http://localhost:5173
echo.
pause

