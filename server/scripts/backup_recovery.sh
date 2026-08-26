#!/bin/bash
# Backup and Recovery Script for DEIMS
# Usage: ./backup_recovery.sh [backup|restore] [backup_dir]

COMMAND=$1
BACKUP_DIR=${2:-./backups}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_USER=${MYSQL_USER:-root}
DB_PASS=${MYSQL_PASSWORD:-""}
DB_NAME=${MYSQL_DATABASE:-DEIMS}
ENCRYPTED_DIR="./encrypted"

mkdir -p "$BACKUP_DIR"

case "$COMMAND" in
    backup)
        echo "Starting DEIMS Backup..."
        
        # 1. Backup Database
        echo "Dumping MySQL Database..."
        if [ -z "$DB_PASS" ]; then
            mysqldump -u "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
        else
            mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
        fi
        
        # 2. Backup Encrypted Evidence
        echo "Backing up encrypted evidence..."
        tar -czf "$BACKUP_DIR/evidence_backup_$TIMESTAMP.tar.gz" -C "$ENCRYPTED_DIR" .
        
        echo "Backup completed successfully! Stored in $BACKUP_DIR"
        ;;
    restore)
        echo "Starting DEIMS Restore..."
        LATEST_SQL=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -1)
        LATEST_TAR=$(ls -t "$BACKUP_DIR"/evidence_backup_*.tar.gz 2>/dev/null | head -1)
        
        if [ -z "$LATEST_SQL" ] || [ -z "$LATEST_TAR" ]; then
            echo "No backups found in $BACKUP_DIR"
            exit 1
        fi
        
        echo "Restoring Database from $LATEST_SQL..."
        if [ -z "$DB_PASS" ]; then
            mysql -u "$DB_USER" "$DB_NAME" < "$LATEST_SQL"
        else
            mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$LATEST_SQL"
        fi
        
        echo "Restoring Evidence from $LATEST_TAR..."
        mkdir -p "$ENCRYPTED_DIR"
        tar -xzf "$LATEST_TAR" -C "$ENCRYPTED_DIR"
        
        echo "Restore completed successfully!"
        ;;
    *)
        echo "Usage: $0 {backup|restore} [backup_dir]"
        exit 1
esac
