#!/bin/bash

echo "🔧 COMPREHENSIVE CORS FIX - Removing ALL CORS headers from Nginx"

# Backup current nginx config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Remove ALL CORS headers from nginx and let Django handle CORS
sudo tee /tmp/clean-family-api.conf > /dev/null << 'EOF'
# Family Bookkeeping API routing - NO CORS HEADERS (Django handles CORS)
location /family-api/ {
    # Remove /family-api prefix and proxy to Django backend
    rewrite ^/family-api/(.*)$ /$1 break;
    
    # Proxy to Django backend on port 3017
    proxy_pass http://localhost:3017/api/;
    
    # Headers for proper API communication
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # NO CORS HEADERS - Let Django handle CORS completely
}
EOF

# Remove any existing family-api configuration
sudo sed -i '/# Family Bookkeeping API routing/,/^}/d' /etc/nginx/sites-available/default

# Add the clean configuration
sudo cat /tmp/clean-family-api.conf >> /etc/nginx/sites-available/default

echo "✅ Nginx configuration updated - CORS headers removed!"

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid!"
    
    # Reload nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    
    echo "🎉 CORS headers removed from Nginx!"
    echo "📍 Django will handle CORS completely"
else
    echo "❌ Nginx configuration has errors!"
    echo "🔄 Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/default
    exit 1
fi

# Clean up temp file
rm -f /tmp/clean-family-api.conf

echo "✅ CORS fix completed - Django will handle all CORS!"
