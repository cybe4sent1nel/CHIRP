# Chirp Development Server - Unified Start Script (PowerShell)
# This script starts both client and server concurrently

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Starting Chirp Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exist in both directories
if (-not (Test-Path "server\node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}

if (-not (Test-Path "client\node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}

# Check if concurrently is installed
$concurrentlyExists = Get-Command concurrently -ErrorAction SilentlyContinue
if (-not $concurrentlyExists) {
    Write-Host "Installing concurrently globally..." -ForegroundColor Yellow
    npm install -g concurrently
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Magenta
Write-Host "Backend: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Inngest: http://localhost:8288" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray
Write-Host ""

# Start all three services concurrently
npx concurrently --names "SERVER,CLIENT,INNGEST" --prefix-colors "cyan,magenta,yellow" "cd server; npm run dev" "cd client; npm run dev" "cd server; npx inngest-cli@latest dev"
