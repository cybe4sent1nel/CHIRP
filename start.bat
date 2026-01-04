@echo off
REM ====================================================
REM Chirp - Full Stack Social Media App
REM Windows Start Script for Frontend and Backend
REM ====================================================

echo.
echo ====================================================
echo Starting Chirp Social Media App...
echo ====================================================
echo.

REM Start backend in new window
echo Starting Backend Server...
start cmd /k "cd server && npm run dev"

REM Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak

REM Start frontend in new window
echo Starting Frontend Client...
start cmd /k "cd client && npm run dev"

echo.
echo ====================================================
echo Both processes are running in separate windows
echo Close the windows to stop the application
echo ====================================================
echo.
