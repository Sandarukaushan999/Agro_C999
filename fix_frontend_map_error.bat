@echo off
echo 🔧 Fixing Frontend Map Error in PredictionResult
echo ================================================

echo.
echo Issue found: "Cannot read properties of undefined (reading 'map')"
echo.
echo Fixes being applied:
echo 1. ✅ Fixed solution data structure access
echo 2. ✅ Added null checks for arrays before mapping
echo 3. ✅ Fixed rating and comment mutations
echo 4. ✅ Added fallback values for undefined data
echo.

REM Kill existing processes
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak >nul

REM Check model
if not exist "ml_service\models\potato_model_best.pth" (
    echo ❌ Model not found! Run train_potato.bat first.
    pause
    exit /b 1
)

echo ✅ Model found

REM Create env files if needed
if not exist "backend\.env" call setup_environment.bat

echo.
echo Starting services with frontend map error fixes...
echo.

REM Start ML Service
echo [1/3] Starting ML Service...
start "ML Service" cmd /k "cd /d %~dp0ml_service && venv\Scripts\activate && python main.py"

timeout /t 8 /nobreak >nul

REM Start Backend
echo [2/3] Starting Backend...
start "Backend" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 5 /nobreak >nul

REM Start Frontend
echo [3/3] Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ All services started with frontend map error fixes!
echo.
echo 🔧 Fixes Applied:
echo    - Fixed solution.data.symptoms access to solution.data.solution.symptoms
echo    - Added null checks: (array || []).map()
echo    - Fixed rating and comment mutation IDs
echo    - Added fallback values for undefined data
echo.
echo 🧪 Test the fixes:
echo    1. Visit: http://localhost:5173
echo    2. Upload a healthy potato image - should work
echo    3. Upload a diseased potato image - should work
echo    4. No more "Cannot read properties of undefined" errors
echo    5. Solutions should display properly
echo.
echo ⏳ Wait 30 seconds for services to start...
echo Then test with both healthy and diseased images!
echo.
pause
