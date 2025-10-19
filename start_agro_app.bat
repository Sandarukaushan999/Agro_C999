@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set PLANT=%~1
if "%PLANT%"=="" set PLANT=potato
set PLANT_LC=%PLANT%
for %%A in ("%PLANT%") do set PLANT_LC=%%~A
set PLANT_LC=%PLANT_LC:~0,200%

echo ======================================================
echo   🚀 Starting Agro_C (plant: %PLANT_LC%)
echo ======================================================
echo.

REM 0) Optional pre-switch for tomato to ensure .env and model path
if /I "%PLANT_LC%"=="tomato" (
    if exist "switch_to_tomato_model.bat" (
        echo [0/7] Preparing tomato model/files...
        call switch_to_tomato_model.bat
    ) else (
        echo [0/7] Tomato switch script not found; continuing without file copy.
    )
)

REM 1) Clean up any leftover processes
echo [1/7] Cleaning up existing Node/Python processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak >nul

REM 2) Verify/install dependencies
echo [2/7] Verifying dependencies...

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
REM 3) Start databases/storage via Docker (optional)
echo [3/7] Starting Database & Storage (Docker)...
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
echo [4/7] Starting ML Service...
pushd ml_service
start "ML Service" cmd /k "venv\Scripts\activate && python main.py"
popd
echo    ⏳ Waiting for ML Service to be healthy...

REM Wait for ML /health up and model_loaded true (max ~45s)
powershell -NoProfile -Command "^$
$max=45; for($i=0;$i -lt $max;$i++){ try { $r=Invoke-RestMethod -UseBasicParsing http://localhost:8000/health; if($r -and $r.model_loaded){ exit 0 } } catch {} Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
    echo    ❌ ML Service did not become healthy in time.
) else (
    echo    ✅ ML Service is healthy.
)

REM 5) Switch active model via API (potato/tomato)
echo [5/7] Selecting active plant model: %PLANT_LC%
powershell -NoProfile -Command "^$
$body = @{ plant = '%PLANT_LC%' } | ConvertTo-Json; ^
try { Invoke-RestMethod -UseBasicParsing -Method Post -ContentType 'application/json' -Body $body -Uri http://localhost:8000/model/switch | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo    ⚠️ Model switch API call failed; continuing.
) else (
    echo    ✅ Model switched to %PLANT_LC%.
)

REM 6) Start Backend API
echo [6/7] Starting Backend API...
pushd backend
start "Backend API" cmd /k "npm start"
popd
echo    ⏳ Waiting for Backend API health...

REM Wait for Backend /health (max ~25s)
powershell -NoProfile -Command "^$
$max=25; for($i=0;$i -lt $max;$i++){ try { $r=Invoke-RestMethod -UseBasicParsing http://localhost:5000/health; if($r -and $r.status -eq 'OK'){ exit 0 } } catch {} Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
    echo    ⚠️ Backend did not report healthy in time.
) else (
    echo    ✅ Backend is healthy.
)

REM 7) Start Frontend
echo [7/7] Starting Frontend (Vite)...
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

echo.
echo 💡 Tip: You can pass 'potato' or 'tomato' as an argument, e.g.:

echo    start_agro_app.bat tomato

echo.
pause

endlocal

