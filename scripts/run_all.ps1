# TRACE Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TRACE: Threat Reconstruction & Autonomous Cyber Evidence" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if venv exists
if (-not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "[-] Virtual environment not found. Please run python -m venv venv and install dependencies." -ForegroundColor Red
    exit 1
}

Write-Host "[+] Starting TRACE FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendJob = Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m uvicorn backend.main:app --host 127.0.0.1 --port 8000" -PassThru

Start-Sleep -Seconds 2

Write-Host "[+] Starting TRACE Next.js Frontend on http://localhost:3000..." -ForegroundColor Green
Set-Location frontend
npm run start
