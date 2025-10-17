#!/bin/bash

echo "💾 Creating backup of Django Family Bookkeeping Backend"

# Configuration
BACKUP_DIR="/opt/backups"
APP_DIR="/opt/family-bookkeeping"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="family_bookkeeping_backup_$DATE.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create backup directory
echo "📁 Creating backup directory..."
mkdir -p $BACKUP_DIR

# Create database backup
echo "🗄️ Backing up database..."
pg_dump -h localhost -U family_user -d family_bookkeeping_prod > $BACKUP_DIR/database_$DATE.sql
if [ $? -eq 0 ]; then
    print_status "Database backup created"
else
    print_error "Database backup failed"
    exit 1
fi

# Create application backup
echo "📦 Backing up application files..."
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.git' \
    -C /opt family-bookkeeping

if [ $? -eq 0 ]; then
    print_status "Application backup created: $BACKUP_FILE"
else
    print_error "Application backup failed"
    exit 1
fi

# Create media files backup
echo "📸 Backing up media files..."
if [ -d "$APP_DIR/media" ]; then
    tar -czf $BACKUP_DIR/media_$DATE.tar.gz -C $APP_DIR media
    print_status "Media files backup created"
else
    print_warning "No media files to backup"
fi

# Create static files backup
echo "📁 Backing up static files..."
if [ -d "$APP_DIR/staticfiles" ]; then
    tar -czf $BACKUP_DIR/static_$DATE.tar.gz -C $APP_DIR staticfiles
    print_status "Static files backup created"
else
    print_warning "No static files to backup"
fi

# Cleanup old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "family_bookkeeping_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "database_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "static_*.tar.gz" -mtime +7 -delete

print_status "Old backups cleaned up"

# Show backup summary
echo ""
echo "📊 Backup Summary:"
echo "   📁 Backup Directory: $BACKUP_DIR"
echo "   🗄️ Database: database_$DATE.sql"
echo "   📦 Application: $BACKUP_FILE"
echo "   📸 Media: media_$DATE.tar.gz"
echo "   📁 Static: static_$DATE.tar.gz"
echo ""

# Show backup sizes
echo "📏 Backup Sizes:"
ls -lh $BACKUP_DIR/*$DATE* | awk '{print "   " $5 " " $9}'

print_status "Backup completed successfully!"
echo ""
echo "🔄 To restore from backup:"
echo "   1. Stop services: systemctl stop family-bookkeeping nginx"
echo "   2. Restore database: psql -U family_user -d family_bookkeeping_prod < $BACKUP_DIR/database_$DATE.sql"
echo "   3. Restore application: tar -xzf $BACKUP_DIR/$BACKUP_FILE -C /opt/"
echo "   4. Restore media: tar -xzf $BACKUP_DIR/media_$DATE.tar.gz -C $APP_DIR/"
echo "   5. Start services: systemctl start family-bookkeeping nginx"
