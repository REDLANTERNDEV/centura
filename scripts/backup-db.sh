#!/bin/bash

# ============================================
# Database Backup Script
# Automated PostgreSQL backup with rotation
# ============================================

set -e

# Configuration
BACKUP_DIR="./backups"
DB_CONTAINER="mini-saas-postgres"
DB_NAME="${DB_NAME:-mini_saas_erp}"
DB_USER="${DB_USER:-postgres}"
MAX_BACKUPS=7  # Keep last 7 backups

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

echo "🗄️  Starting database backup..."
echo "Database: $DB_NAME"
echo "Container: $DB_CONTAINER"
echo "Timestamp: $TIMESTAMP"

# Create backup
docker-compose exec -T $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Backup created: $BACKUP_FILE"

# Get backup size
if [[ "$OSTYPE" == "darwin"* ]]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
else
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | awk '{print $1}')
fi

echo "📦 Backup size: $BACKUP_SIZE"

# Cleanup old backups (keep last MAX_BACKUPS)
echo "🧹 Cleaning up old backups (keeping last $MAX_BACKUPS)..."
cd "$BACKUP_DIR"
ls -t backup_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
cd - > /dev/null

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
echo "📊 Total backups: $BACKUP_COUNT"

echo "✨ Backup completed successfully!"
