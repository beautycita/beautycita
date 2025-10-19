#!/bin/bash

# BeautyCita Database Backup Script
# Performs automated PostgreSQL backups with retention policy

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/var/backups/beautycita"
LOG_FILE="/var/log/beautycita-backup.log"
RETENTION_DAYS=30
DATABASE="beautycita"
DB_USER="beautycita_app"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/beautycita_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Load database password from secure environment
load_db_password() {
    if [[ -f "/var/www/beautycita.com/.master.key" && -f "/var/www/beautycita.com/.env.encrypted" ]]; then
        # Use the secure environment loader to get the password
        DB_PASSWORD=$(cd /var/www/beautycita.com && node -e "
            const loader = require('./secure-env-loader');
            try {
                loader.loadSecureEnv();
                console.log(process.env.DB_PASSWORD);
            } catch (error) {
                process.exit(1);
            }
        " 2>>"$LOG_FILE")

        if [[ -n "$DB_PASSWORD" ]]; then
            log_message "Using encrypted environment variables"
        else
            log_message "ERROR: Failed to load password from encrypted environment"
            exit 1
        fi
    else
        log_message "WARNING: Encrypted environment not found, trying fallback"
        if [[ -f "/var/www/beautycita.com/.env" ]]; then
            DB_PASSWORD=$(grep "^DB_PASSWORD=" /var/www/beautycita.com/.env | cut -d'=' -f2)
            log_message "Using fallback .env file"
        else
            log_message "ERROR: No database password found"
            exit 1
        fi
    fi

    if [[ -z "$DB_PASSWORD" ]]; then
        log_message "ERROR: Database password is empty"
        exit 1
    fi
}

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to send notification (placeholder for future email/slack integration)
send_notification() {
    local status=$1
    local message=$2
    # Future: send email or Slack notification
    log_message "NOTIFICATION: $status - $message"
}

# Start backup process
log_message "Starting database backup for $DATABASE"

# Load database password
load_db_password

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform database dump
log_message "Creating database dump..."
export PGPASSWORD="$DB_PASSWORD"

if pg_dump -h localhost -U "$DB_USER" -d "$DATABASE" \
    --verbose \
    --clean \
    --create \
    --if-exists \
    --format=plain \
    --no-owner \
    --no-privileges \
    > "$BACKUP_FILE" 2>>"$LOG_FILE"; then

    log_message "Database dump completed successfully: $BACKUP_FILE"

    # Compress the backup
    log_message "Compressing backup..."
    if gzip "$BACKUP_FILE"; then
        log_message "Backup compressed: $COMPRESSED_FILE"

        # Calculate file size
        BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        log_message "Backup size: $BACKUP_SIZE"

        # Verify backup integrity
        log_message "Verifying backup integrity..."
        if gunzip -t "$COMPRESSED_FILE" 2>>"$LOG_FILE"; then
            log_message "Backup integrity verified successfully"

            # Cleanup old backups (retention policy)
            log_message "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
            find "$BACKUP_DIR" -name "beautycita_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>>"$LOG_FILE"

            # Count remaining backups
            BACKUP_COUNT=$(find "$BACKUP_DIR" -name "beautycita_backup_*.sql.gz" | wc -l)
            log_message "Backup completed successfully. Total backups retained: $BACKUP_COUNT"

            send_notification "SUCCESS" "Database backup completed. Size: $BACKUP_SIZE, Retained: $BACKUP_COUNT backups"

        else
            log_message "ERROR: Backup integrity check failed"
            send_notification "ERROR" "Backup integrity verification failed"
            exit 1
        fi

    else
        log_message "ERROR: Failed to compress backup"
        send_notification "ERROR" "Backup compression failed"
        exit 1
    fi

else
    log_message "ERROR: Database dump failed"
    send_notification "ERROR" "Database dump failed"
    exit 1
fi

# Set proper permissions
chmod 600 "$COMPRESSED_FILE"
chown www-data:www-data "$COMPRESSED_FILE"

log_message "Database backup process completed successfully"
exit 0