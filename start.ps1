# ====================================================
# Chirp - Full Stack Social Media App
# PowerShell Start Script for Frontend and Backend
# ====================================================

Write-Host "`n===================================================="
Write-Host "🐦 Starting Chirp Social Media App"
Write-Host "====================================================" -ForegroundColor Cyan

# Start backend
Write-Host "`n🚀 Starting Backend Server..." -ForegroundColor Green
$serverProcess = Start-Process `
  -FilePath "cmd.exe" `
  -ArgumentList "/k", "cd server && npm run dev" `
  -PassThru

# Wait for backend to initialize
Start-Sleep -Seconds 2

# Start frontend
Write-Host "`n🎨 Starting Frontend Client..." -ForegroundColor Green
$clientProcess = Start-Process `
  -FilePath "cmd.exe" `
  -ArgumentList "/k", "cd client && npm run dev" `
  -PassThru

Write-Host "`n===================================================="
Write-Host "✅ Both processes started successfully!"
Write-Host "`n📝 Backend running on: http://localhost:5000"
Write-Host "🌐 Frontend running on: http://localhost:5173"
Write-Host "`nClose the terminal windows to stop the application"
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Wait for processes to exit
$serverProcess.WaitForExit()
$clientProcess.WaitForExit()
