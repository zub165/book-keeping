#!/bin/bash

echo "🔒 Setting up SSL Certificate for Django Family Bookkeeping Backend"

# Configuration
DOMAIN="your-domain.com"  # Replace with your domain
EMAIL="your-email@example.com"  # Replace with your email

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

# Check if domain is provided
if [ "$DOMAIN" = "your-domain.com" ]; then
    print_error "Please update the DOMAIN variable in this script"
    exit 1
fi

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
echo "⏸️ Stopping Nginx temporarily..."
sudo systemctl stop nginx

# Get SSL certificate
echo "🔒 Obtaining SSL certificate..."
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

if [ $? -eq 0 ]; then
    print_status "SSL certificate obtained successfully"
else
    print_error "Failed to obtain SSL certificate"
    exit 1
fi

# Update Nginx configuration for HTTPS
echo "🌐 Updating Nginx configuration for HTTPS..."
sudo tee /etc/nginx/sites-available/family-bookkeeping << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        alias /opt/family-bookkeeping/staticfiles/;
    }

    location /media/ {
        alias /opt/family-bookkeeping/media/;
    }
}
NGINX

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    print_status "Nginx configuration is valid"
    
    # Start Nginx
    echo "🚀 Starting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    print_status "Nginx started with SSL"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Setup automatic renewal
echo "🔄 Setting up automatic SSL renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

print_status "SSL setup completed successfully!"
echo ""
echo "🎯 Your Django backend is now running with SSL:"
echo "   🔒 HTTPS: https://$DOMAIN"
echo "   📊 API: https://$DOMAIN/api/"
echo "   👤 Admin: https://$DOMAIN/admin/"
echo ""
echo "🔄 SSL certificate will auto-renew every 12 hours"
echo ""
print_warning "Update your Flutter app API URL to https://$DOMAIN/api/"
