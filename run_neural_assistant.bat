@echo off
title FloodSaathi Neural AI Assistant
cls
echo ======================================================================
echo           Starting FloodSaathi Real Neural AI Assistant
echo ======================================================================
echo.
"%~dp0.venv\Scripts\python.exe" "%~dp0scripts\neural_assistant.py" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Error] Neural assistant exited with code %ERRORLEVEL%.
    pause
)
