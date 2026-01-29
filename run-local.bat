@echo off
setlocal enabledelayedexpansion
echo ========================================
echo    SCL v3 - Local Development Server
echo ========================================
echo.

:: Check if port 3000 is in use and kill the process
echo Checking for existing process on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo Found process %%a using port 3000, terminating...
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo Process terminated successfully.
    )
)

:: Small delay to ensure port is released
timeout /t 1 /nobreak >nul

echo.
echo Starting Next.js development server...
echo Access the app at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo ========================================
echo.

:: Run the dev server
npm run dev
