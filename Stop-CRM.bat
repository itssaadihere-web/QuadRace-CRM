@echo off
title Stop Quadrace CRM
echo Stopping any running Quadrace CRM processes...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /f /pid %%a 2>nul
)

echo Quadrace CRM stopped successfully.
timeout /t 2 >nul
exit
