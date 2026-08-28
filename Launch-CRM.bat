@echo off
title Quadrace CRM Launcher
cd /d "%~dp0\dashboard"

echo ===================================================
echo   Starting Quadrace CRM & Solomon AI Portal...
echo ===================================================
echo.

:: Check if port 3000 is already active
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo CRM server is already running!
) else (
    echo Launching CRM server in background...
    start /min "" cmd /c "npm run dev"
    timeout /t 3 /nobreak >nul
)

echo Opening Quadrace CRM in your browser...
start http://localhost:3000/leads

exit
