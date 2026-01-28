#!/bin/bash

# NRT Database Backup Utility
# Backs up dev.db with timestamp, keeps last 30 backups
#
# Usage:
#   ./scripts/backup-db.sh           # Run ad-hoc backup
#   ./scripts/backup-db.sh --quiet   # Silent mode (for cron)
#
# To schedule nightly backups (e.g., 2 AM):
#   crontab -e
#   0 2 * * * /Users/miketoles/dev/NRT/scripts/backup-db.sh --quiet

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="$PROJECT_DIR/dev.db"
BACKUP_DIR="$PROJECT_DIR/backups"
MAX_BACKUPS=30
QUIET=false

# Parse arguments
if [[ "$1" == "--quiet" ]]; then
    QUIET=true
fi

log() {
    if [[ "$QUIET" == false ]]; then
        echo "$1"
    fi
}

# Check if database exists
if [[ ! -f "$DB_FILE" ]]; then
    log "Error: Database file not found at $DB_FILE"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/dev_${TIMESTAMP}.db"

# Create backup
cp "$DB_FILE" "$BACKUP_FILE"
log "Backup created: $BACKUP_FILE"

# Get file size
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup size: $SIZE"

# Remove old backups (keep last MAX_BACKUPS)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/dev_*.db 2>/dev/null | wc -l | tr -d ' ')
if [[ $BACKUP_COUNT -gt $MAX_BACKUPS ]]; then
    REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    log "Removing $REMOVE_COUNT old backup(s)..."
    ls -1t "$BACKUP_DIR"/dev_*.db | tail -n $REMOVE_COUNT | xargs rm -f
fi

# Summary
FINAL_COUNT=$(ls -1 "$BACKUP_DIR"/dev_*.db 2>/dev/null | wc -l | tr -d ' ')
log "Total backups: $FINAL_COUNT"
log "Done."
