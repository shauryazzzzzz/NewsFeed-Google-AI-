@echo off
title NewsFeed Google AI - News Intelligence Dashboard

echo.
echo  ============================================================
echo   NewsFeed Google AI - Starting Server...
echo   News Intelligence Dashboard (Vite + Express + Firebase)
echo  ============================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo  [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

if not exist ".env.local" (
    echo  [WARN] .env.local not found. Copying from .env.example...
    copy ".env.example" ".env.local" >nul
    echo  [WARN] Edit .env.local with your GEMINI_API_KEY and Firebase keys.
    echo.
)

echo  [OK] Starting on http://localhost:3000
echo  [OK] Press Ctrl+C to stop
echo.
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"
node_modules\.bin\tsx.cmd server.ts

echo.
echo  [INFO] Server stopped.
pause
