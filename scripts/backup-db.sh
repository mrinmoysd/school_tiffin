#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup-db.sh [environment]

ENVIRONMENT=${1:-development}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/schooltiffin_${ENVIRONMENT}_${TIMESTAMP}.sql"

echo "🔄 Starting database backup for ${ENVIRONMENT}..."

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Load environment variables
if [ -f "apps/backend/.env.${ENVIRONMENT}" ]; then
  source apps/backend/.env.${ENVIRONMENT}
elif [ -f "apps/backend/.env" ]; then
  source apps/backend/.env
else
  echo "❌ Environment file not found"
  exit 1
fi

# Backup database
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Creating backup..."
  pg_dump $DATABASE_URL > $BACKUP_FILE
  
  if [ $? -eq 0 ]; then
    echo "✅ Backup completed: $BACKUP_FILE"
    
    # Compress backup
    gzip $BACKUP_FILE
    echo "📦 Compressed: ${BACKUP_FILE}.gz"
    
    # Clean up old backups (keep last 7 days)
    find ${BACKUP_DIR} -name "*.sql.gz" -mtime +7 -delete
    echo "🧹 Cleaned up old backups"
  else
    echo "❌ Backup failed"
    exit 1
  fi
else
  echo "❌ DATABASE_URL not found"
  exit 1
fi
