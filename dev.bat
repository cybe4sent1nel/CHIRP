@echo off
REM Chirp Development Server - Unified Start Script (Windows)
REM This script starts both client and server concurrently

echo.
echo ========================================
echo   Starting Chirp Development Environment
echo ========================================
echo.

REM Check if node_modules exist in both directories
if not exist "server\node_modules\" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules\" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

REM Check if concurrently is installed
where concurrently >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing concurrently globally...
    call npm install -g concurrently
)

echo.
echo Starting servers...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:4000
echo Inngest: http://localhost:8288
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start all three services concurrently
call npx concurrently --names "SERVER,CLIENT,INNGEST" --prefix-colors "cyan,magenta,yellow" "cd server && npm run dev" "cd client && npm run dev" "cd server && npx inngest-cli@latest dev"
