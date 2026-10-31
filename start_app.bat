@echo off
setlocal
cd /d "%~dp0"
title FloodSaathi App Launcher

echo ======================================================================
echo              Launching FloodSaathi Application & Server
echo ======================================================================
echo.

:: Check if server is already responding on port 8080
powershell -NoProfile -Command "try { $res = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/model/status' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] FloodSaathi Python Server is already running on http://localhost:8080.
) else (
    echo [*] Starting FloodSaathi Python Server in background...
    start "" /b "%~dp0.venv\Scripts\python.exe" "%~dp0server.py"
    :: Wait up to 5 seconds for server to be ready
    powershell -NoProfile -Command "for ($i=0; $i -lt 10; $i++) { try { $res = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/model/status' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { Start-Sleep -Milliseconds 500 } }; exit 1" >nul 2>&1
)

echo [*] Opening FloodSaathi in your browser...
start http://localhost:8080

echo.
echo ======================================================================
echo  FloodSaathi is active at http://localhost:8080
echo  Keep this window open or minimize it.
echo ======================================================================
