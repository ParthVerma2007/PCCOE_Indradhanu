Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Starting SpatialCadastre3D MVP (Backend + Frontend)" -ForegroundColor Green
Write-Host "Unified 3D Spatial Indexing for Property Verification & Compliance" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# Free up ports if occupied
@(8000, 3000) | ForEach-Object {
    $port = $_
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            Write-Host "Freeing port $port (PID $($_.OwningProcess))..." -ForegroundColor Yellow
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 1

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host "`nBackend API: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend UI:  http://localhost:3000" -ForegroundColor Green
Write-Host "API Docs:     http://127.0.0.1:8000/docs" -ForegroundColor Yellow
