@echo off
echo 🚀 Starting Agro_C Services...
echo.

REM Kill any existing processes
echo [1/5] Cleaning up existing processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start Database
echo [2/5] Starting Database...
cd infra
start "Database" cmd /k "docker-compose -f docker-compose-simple.yml up"
cd ..
timeout /t 5 /nobreak >nul

REM Start ML Service
echo [3/5] Starting ML Service...
cd ml_service
start "ML Service" cmd /k "venv\Scripts\activate && python main.py"
cd ..
timeout /t 10 /nobreak >nul

REM Start Backend
echo [4/5] Starting Backend...
cd backend
start "Backend" cmd /k "npm start"
cd ..
timeout /t 5 /nobreak >nul

REM Start Frontend
echo [5/5] Starting Frontend...
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ All services started!
echo.
echo 🌐 Access Points:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:5000
echo    ML Service: http://localhost:8000
echo.
echo ⏳ Please wait 30 seconds for all services to fully start...
echo Then visit: http://localhost:5173
echo.
pause




