#!/bin/bash

# BeautyCita Database Restoration Script
# Restores PostgreSQL database from backup

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/var/backups/beautycita"
LOG_FILE="/var/log/beautycita-restore.log"
DATABASE="beautycita"
DB_USER="beautycita_app"
DB_PASSWORD="qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk="

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/beautycita_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_message "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_message "Starting database restoration from: $BACKUP_FILE"

# Verify backup integrity
log_message "Verifying backup integrity..."
if ! gunzip -t "$BACKUP_FILE" 2>>"$LOG_FILE"; then
    log_message "ERROR: Backup file is corrupted"
    exit 1
fi

log_message "Backup integrity verified"

# Warning about data loss
echo "WARNING: This will completely replace the current database!"
echo "Current database: $DATABASE"
echo "Backup file: $BACKUP_FILE"
echo "All existing data will be lost!"
read -p "Are you sure you want to continue? (yes/NO): " confirm

if [ "$confirm" != "yes" ]; then
    log_message "Restoration cancelled by user"
    exit 0
fi

# Stop application to prevent connections during restore
log_message "Stopping application..."
su - www-data -s /bin/bash -c "pm2 stop beautycita-api" || true

# Wait for connections to close
sleep 5

# Extract and restore database
log_message "Extracting and restoring database..."
export PGPASSWORD="$DB_PASSWORD"

TEMP_FILE="/tmp/beautycita_restore_$$.sql"

if gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"; then
    log_message "Backup extracted to temporary file"

    # Restore database
    if psql -h localhost -U "$DB_USER" -d postgres -f "$TEMP_FILE" 2>>"$LOG_FILE"; then
        log_message "Database restored successfully"

        # Cleanup temporary file
        rm -f "$TEMP_FILE"

        # Start application
        log_message "Starting application..."
        su - www-data -s /bin/bash -c "pm2 start beautycita-api" || log_message "WARNING: Failed to start application automatically"

        log_message "Database restoration completed successfully"

    else
        log_message "ERROR: Database restoration failed"
        rm -f "$TEMP_FILE"

        # Try to start application anyway
        su - www-data -s /bin/bash -c "pm2 start beautycita-api" || true
        exit 1
    fi

else
    log_message "ERROR: Failed to extract backup file"
    exit 1
fi

log_message "Restoration process completed"