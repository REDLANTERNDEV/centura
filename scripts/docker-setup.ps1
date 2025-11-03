# ============================================
# Docker Quick Setup Script for Windows
# For PowerShell
# ============================================

Write-Host "🐳 Mini SaaS ERP - Docker Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose are installed" -ForegroundColor Green

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.docker.example .env
    
    # Generate random secrets
    function Get-RandomHex {
        param([int]$Length)
        $bytes = New-Object byte[] $Length
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes)
        return [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
    }
    
    $JWT_SECRET = Get-RandomHex -Length 32
    $SESSION_SECRET = Get-RandomHex -Length 32
    $DB_PASSWORD = Get-RandomHex -Length 16
    
    # Update .env file with generated secrets
    $content = Get-Content .env
    $content = $content -replace 'your-super-secure-jwt-secret-key-here-at-least-256-bits-long', $JWT_SECRET
    $content = $content -replace 'your-session-secret-key-here-different-from-jwt-also-256-bits', $SESSION_SECRET
    $content = $content -replace 'your-super-secure-database-password-here', $DB_PASSWORD
    $content | Set-Content .env
    
    Write-Host "✅ .env file created with secure random secrets" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Blue
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path backups | Out-Null
New-Item -ItemType Directory -Force -Path logs | Out-Null

# Choose environment
Write-Host ""
Write-Host "Which environment do you want to start?" -ForegroundColor Cyan
Write-Host "1) Development (with hot reload)"
Write-Host "2) Production"
$choice = Read-Host "Enter your choice (1 or 2)"

switch ($choice) {
    1 {
        Write-Host "🚀 Starting Development Environment..." -ForegroundColor Green
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
    }
    2 {
        Write-Host "🚀 Starting Production Environment..." -ForegroundColor Green
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
        
        Write-Host ""
        Write-Host "✅ Production environment started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access your application at:" -ForegroundColor Cyan
        Write-Host "  Frontend: http://localhost:4321" -ForegroundColor White
        Write-Host "  Backend:  http://localhost:8765" -ForegroundColor White
        Write-Host ""
        Write-Host "View logs with: docker-compose logs -f" -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}
