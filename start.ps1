# Smart Railway Reservation System - Start Script
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Smart Railway Reservation System" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Start MongoDB service if installed
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService) {
    if ($mongoService.Status -ne "Running") {
        Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
        Start-Service -Name "MongoDB"
        Start-Sleep -Seconds 2
        Write-Host "MongoDB started." -ForegroundColor Green
    } else {
        Write-Host "MongoDB is already running." -ForegroundColor Green
    }
} else {
    Write-Host "WARNING: MongoDB service not found." -ForegroundColor Red
    Write-Host "Make sure MongoDB is running before starting the servers." -ForegroundColor Yellow
    Write-Host "Install MongoDB: winget install MongoDB.Server" -ForegroundColor Yellow
    Write-Host ""
}

# Ask to seed database
$seedChoice = Read-Host "Seed the database with demo data? (y/n, press Enter to skip)"
if ($seedChoice -eq "y" -or $seedChoice -eq "Y") {
    Write-Host "Seeding database..." -ForegroundColor Yellow
    Push-Location "$PSScriptRoot\backend"
    node utils/seed.js
    Pop-Location
    Write-Host ""
}

# Start backend server
Write-Host "Starting Backend (port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; npm run dev"
Start-Sleep -Seconds 2

# Start frontend server
Write-Host "Starting Frontend (port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  Servers started!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Demo credentials:" -ForegroundColor Yellow
Write-Host "  Admin:    admin@railway.com  / Admin@123" -ForegroundColor Yellow
Write-Host "  Passenger: john@example.com / User@123" -ForegroundColor Yellow
