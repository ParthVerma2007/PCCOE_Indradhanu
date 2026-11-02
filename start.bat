@echo off
echo ======================================================================
echo Starting SpatialCadastre3D MVP (Backend + Frontend)
echo Unified 3D Spatial Indexing for Property Verification & Compliance
echo ======================================================================

:: Free up port 8000 and 3000 if previously occupied
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Freeing port 8000 (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Freeing port 3000 (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

cd /d "%~dp0backend"
start "SpatialCadastre3D Backend (FastAPI)" cmd /k "python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

cd /d "%~dp0frontend"
start "SpatialCadastre3D Frontend (Vite React)" cmd /k "npm run dev"

echo.
echo ======================================================================
echo Applications started!
echo Backend API: http://127.0.0.1:8000
echo Frontend UI: http://localhost:3000
echo Swagger Docs: http://127.0.0.1:8000/docs
echo ======================================================================
