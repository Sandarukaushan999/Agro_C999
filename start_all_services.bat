@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo 🚀 Starting Agro_C Services...
echo.

REM Basic prerequisites summary
echo This script will:
echo   - Ensure dependencies for backend, frontend, and ml_service
echo   - Start Docker services (MongoDB/MinIO) via infra/docker-compose-simple.yml
echo   - Launch ML Service, Backend API, and Frontend in separate windows
echo.

REM 1) Clean up any leftover processes
echo [1/6] Cleaning up existing Node/Python processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak >nul

REM 2) Verify/install dependencies
echo [2/6] Verifying dependencies...

REM Backend deps
if exist "backend\node_modules" (
    echo    ✅ Backend dependencies present
) else (
    echo    📦 Installing backend dependencies...
    pushd backend
    call npm install
    popd
)

REM Frontend deps
if exist "frontend\node_modules" (
    echo    ✅ Frontend dependencies present
) else (
    echo    📦 Installing frontend dependencies...
    pushd frontend
    call npm install
    popd
)

REM Python venv and requirements for ML service
if exist "ml_service\venv" (
    echo    ✅ ML Service virtual environment present
) else (
    echo    🐍 Creating ML Service virtual environment...
    pushd ml_service
    python -m venv venv
    if exist "venv\Scripts\activate.bat" (
        call venv\Scripts\activate
        echo    📦 Installing ML requirements...
        pip install --upgrade pip
        pip install -r requirements.txt
        call deactivate 2>nul
    ) else (
        echo    ❌ Failed to create Python venv. Ensure Python is installed and on PATH.
        pause
        popd
        exit /b 1
    )
    popd
)

echo.
REM 3) Start databases/storage via Docker
echo [3/6] Starting Database & Storage (Docker)...
if exist "infra\docker-compose-simple.yml" (
    pushd infra
    start "Database & Storage" cmd /k "docker-compose -f docker-compose-simple.yml up"
    popd
    echo    ⏳ Waiting for services to initialize...
    timeout /t 10 /nobreak >nul
) else (
    echo    ⚠️  infra\docker-compose-simple.yml not found. Skipping Docker services.
)

REM 4) Start ML Service
echo [4/6] Starting ML Service...
pushd ml_service
start "ML Service" cmd /k "venv\Scripts\activate && python main.py"
popd
echo    ⏳ Waiting for ML Service to load the model...
timeout /t 12 /nobreak >nul

REM 5) Start Backend API
echo [5/6] Starting Backend API...
pushd backend
start "Backend API" cmd /k "npm start"
popd
echo    ⏳ Waiting for Backend API to start...
timeout /t 8 /nobreak >nul

REM 6) Start Frontend
echo [6/6] Starting Frontend (Vite)...
pushd frontend
start "Frontend" cmd /k "npm run dev"
popd

echo.
echo ✅ All services have been launched in separate windows.
echo.
echo 🌐 Access Points:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:5000
echo    ML Service: http://localhost:8000
echo    MongoDB: localhost:27017 (if Docker started)
echo    MinIO:   http://localhost:9000 (if Docker started)
echo.
echo ⏳ Give services ~20-30 seconds to fully initialize, then open the Frontend.
echo.
pause

endlocal
