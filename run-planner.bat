@echo off
echo Starting Daily Planner server...
cd /d "%~dp0"
start "Daily Planner Server" /D "%~dp0" npm run dev

echo Waiting for server to start (approx 15 seconds)...
timeout /t 15 /nobreak > nul

echo Opening Daily Planner in browser...
start http://localhost:5556 