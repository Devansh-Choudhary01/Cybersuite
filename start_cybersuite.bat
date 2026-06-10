@echo off
title CyberSuite Launcher
color 0B
echo ===================================================
echo      Starting CyberSuite Services...
echo ===================================================
echo.

:: Start Backend in a new window
echo Starting Python Backend Server...
start "CyberSuite Backend" cmd /k "cd cybersuite-backend && .venv312\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:: Wait 3 seconds to let backend initialize
timeout /t 3 /nobreak > nul

:: Start Frontend in a new window
echo Starting React Frontend...
start "CyberSuite Frontend" cmd /k "cd cybersuite-frontend && npm run dev"

echo.
echo ===================================================
echo Services launched in separate windows!
echo DO NOT close the backend window, or services will fail.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo ===================================================
pause
