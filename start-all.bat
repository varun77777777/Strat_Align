@echo off
:: ============================================================
::  start-all.bat — Starts both the Node.js backend and Python AI service
::  Run from the project root:  "c:\Users\SHIVALEELA\Downloads\start 1"
:: ============================================================

echo.
echo  ========================================================
echo   Strat-Align — Starting All Services
echo  ========================================================
echo.

:: ── Python AI Service (port 8000) ─────────────────────────────────────────
echo [1/2] Starting Python AI Service on port 8000...
start "AI Service :8000" cmd /k "cd /d "%~dp0ai-service" && python main.py"
timeout /t 2 /nobreak >nul

:: ── Node.js Backend (port 5000) ──────────────────────────────────────────
echo [2/2] Starting Node.js Backend on port 5000...
start "Backend :5000" cmd /k "cd /d "%~dp0backend" && npm start"
timeout /t 2 /nobreak >nul

echo.
echo  --------------------------------------------------------
echo   Services launched in separate windows.
echo   Backend  → http://localhost:5000/health
echo   AI Svc   → http://localhost:8000/health
echo   AI Docs  → http://localhost:8000/docs
echo  --------------------------------------------------------
echo.
pause
