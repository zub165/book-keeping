#!/bin/bash

echo "🚀 Deploying Django Family Bookkeeping Backend to GoDaddy VPS"

# Configuration
SERVER="your-vps-ip"  # Replace with your actual VPS IP
USER="root"           # Replace with your VPS username
APP_DIR="/opt/family-bookkeeping"
BACKUP_DIR="/opt/backups"
DOMAIN="your-domain.com"  # Replace with your domain

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if server is reachable
echo "🔍 Checking server connectivity..."
if ! ssh -o ConnectTimeout=10 $USER@$SERVER "echo 'Server is reachable'" 2>/dev/null; then
    print_error "Cannot connect to server $SERVER"
    print_error "Please check your VPS IP and SSH access"
    exit 1
fi
print_status "Server is reachable"

# Create backup
echo "📦 Creating backup..."
ssh $USER@$SERVER "mkdir -p $BACKUP_DIR"
ssh $USER@$SERVER "if [ -d '$APP_DIR' ]; then cp -r $APP_DIR $BACKUP_DIR/backup-\$(date +%Y%m%d_%H%M%S); fi"
print_status "Backup created"

# Upload code
echo "📤 Uploading code..."
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '*.pyc' --exclude '.git' \
    --exclude 'db.sqlite3' --exclude 'staticfiles' --exclude 'media' \
    ./ $USER@$SERVER:$APP_DIR/
print_status "Code uploaded"

# Install system dependencies
echo "📦 Installing system dependencies..."
ssh $USER@$SERVER << EOF
# Update system
apt update

# Install Python and pip
apt install -y python3 python3-pip python3-venv

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install other dependencies
apt install -y git curl wget
EOF
print_status "System dependencies installed"

# Setup PostgreSQL
echo "🗄️ Setting up PostgreSQL..."
ssh $USER@$SERVER << EOF
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << PSQL
CREATE DATABASE family_bookkeeping_prod;
CREATE USER family_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE family_bookkeeping_prod TO family_user;
\q
PSQL
EOF
print_status "PostgreSQL configured"

# Setup application
echo "🔧 Setting up application..."
ssh $USER@$SERVER << EOF
cd $APP_DIR

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements/production.txt

# Load production environment
export \$(cat env.production | grep -v '^#' | xargs)
export DJANGO_SETTINGS_MODULE=bookkeeping.settings

# Run migrations
python manage.py migrate

# Create superuser (if not exists)
python manage.py shell << PYTHON
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@$DOMAIN', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
PYTHON

# Collect static files
python manage.py collectstatic --noinput

# Create log directory
mkdir -p /var/log/django
chown -R www-data:www-data /var/log/django
EOF
print_status "Application configured"

# Setup systemd service
echo "🔧 Setting up systemd service..."
ssh $USER@$SERVER << EOF
cat > /etc/systemd/system/family-bookkeeping.service << SERVICE
[Unit]
Description=Family Bookkeeping Django App
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
Environment=DJANGO_ENV=production
EnvironmentFile=$APP_DIR/env.production
ExecStart=$APP_DIR/venv/bin/gunicorn --bind 0.0.0.0:8000 bookkeeping.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

# Enable and start service
systemctl daemon-reload
systemctl enable family-bookkeeping
systemctl start family-bookkeeping
EOF
print_status "Systemd service configured"

# Setup Nginx
echo "🌐 Setting up Nginx..."
ssh $USER@$SERVER << EOF
cat > /etc/nginx/sites-available/family-bookkeeping << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        alias $APP_DIR/staticfiles/;
    }

    location /media/ {
        alias $APP_DIR/media/;
    }
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/family-bookkeeping /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
EOF
print_status "Nginx configured"

# Check services
echo "🔍 Checking services..."
ssh $USER@$SERVER << EOF
systemctl status family-bookkeeping --no-pager
systemctl status nginx --no-pager
systemctl status postgresql --no-pager
EOF

print_status "Deployment completed successfully!"
echo ""
echo "🎯 Your Django backend is now running on:"
echo "   🌐 HTTP: http://$DOMAIN"
echo "   📊 API: http://$DOMAIN/api/"
echo "   👤 Admin: http://$DOMAIN/admin/"
echo ""
echo "🔑 Admin Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📋 Next Steps:"
echo "   1. Update DNS to point $DOMAIN to your VPS IP"
echo "   2. Install SSL certificate (Let's Encrypt)"
echo "   3. Update your Flutter app API URL to http://$DOMAIN/api/"
echo ""
print_warning "Remember to change the admin password and database password in production!"
