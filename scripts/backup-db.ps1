# ============================================
# Database Backup Script for Windows
# Automated PostgreSQL backup with rotation
# ============================================

param(
    [int]$MaxBackups = 7
)

$ErrorActionPreference = "Stop"

# Configuration
$BACKUP_DIR = ".\backups"
$DB_CONTAINER = "mini-saas-postgres"
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "mini_saas_erp" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

# Create backup directory
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Generate timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "backup_$TIMESTAMP.sql"

Write-Host "🗄️  Starting database backup..." -ForegroundColor Cyan
Write-Host "Database: $DB_NAME" -ForegroundColor White
Write-Host "Container: $DB_CONTAINER" -ForegroundColor White
Write-Host "Timestamp: $TIMESTAMP" -ForegroundColor White

# Create backup
try {
    docker-compose exec -T $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | Set-Content -Path $BACKUP_FILE -Encoding UTF8
    
    # Compress backup
    Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip" -Force
    Remove-Item $BACKUP_FILE
    $BACKUP_FILE = "$BACKUP_FILE.zip"
    
    Write-Host "✅ Backup created: $BACKUP_FILE" -ForegroundColor Green
    
    # Get backup size
    $BackupSize = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Host ("📦 Backup size: {0:N2} MB" -f $BackupSize) -ForegroundColor White
    
    # Cleanup old backups
    Write-Host "🧹 Cleaning up old backups (keeping last $MaxBackups)..." -ForegroundColor Yellow
    
    $Backups = Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.sql.zip" | 
               Sort-Object LastWriteTime -Descending
    
    if ($Backups.Count -gt $MaxBackups) {
        $Backups | Select-Object -Skip $MaxBackups | Remove-Item -Force
    }
    
    $BackupCount = (Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.sql.zip").Count
    Write-Host "📊 Total backups: $BackupCount" -ForegroundColor White
    
    Write-Host "✨ Backup completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backup failed: $_" -ForegroundColor Red
    exit 1
}
