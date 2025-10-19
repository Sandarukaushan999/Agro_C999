@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo Switching ML Service model to TOMATO...

set SRC=ml_training\models\tomato\tomato_model_best.pth
set DST_DIR=ml_service\models
set DST=%DST_DIR%\tomato_model_best.pth
set BACKUP=%DST_DIR%\tomato_model_backup_%DATE:~-4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%.pth

if not exist "%SRC%" (
    echo Source model not found: %SRC%
    echo Make sure tomato training has completed successfully.
    exit /b 1
)

if not exist "%DST_DIR%" (
    mkdir "%DST_DIR%"
)

if exist "%DST%" (
    echo Backing up current tomato model to: %BACKUP%
    copy /y "%DST%" "%BACKUP%" >nul
)

echo Copying tomato model to ML service path...
copy /y "%SRC%" "%DST%" >nul
if errorlevel 1 (
    echo Failed to copy tomato model.
    exit /b 1
)

echo Switched ML Service model to TOMATO at %DST%

rem Ensure ml_service .env has correct tomato settings
set ENV_FILE=ml_service\.env
if not exist "ml_service" (
    echo ml_service directory not found. Skipping .env update.
) else (
    (
        echo HOST=0.0.0.0
        echo PORT=8000
        echo POTATO_MODEL_PATH=models/potato_model_best.pth
        echo TOMATO_MODEL_PATH=%DST:\=/%
        echo TOMATO_INVERT_OUTPUT=true
    )>"%ENV_FILE%"
    echo Updated %ENV_FILE% with tomato settings.
)

echo To apply the change, restart the ML Service window.
if exist "ml_service\venv\Scripts\activate.bat" (
    echo You can restart it via start_all_services.bat or manually:
    echo   cd ml_service ^&^& venv\Scripts\activate ^&^& python main.py
)

endlocal

