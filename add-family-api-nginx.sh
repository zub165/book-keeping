#!/bin/bash

# Script to add Family Bookkeeping API routing to Nginx
# Run this on your GoDaddy server

echo "🔧 Adding Family Bookkeeping API routing to Nginx..."

# Backup current nginx config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Add the family-api location block
sudo tee -a /etc/nginx/sites-available/default > /dev/null << 'EOF'

# Family Bookkeeping API routing
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
    
    # CORS headers for GitHub Pages
    add_header 'Access-Control-Allow-Origin' 'https://zub165.github.io' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://zub165.github.io';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        add_header 'Access-Control-Allow-Credentials' 'true';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
EOF

echo "✅ Nginx configuration updated!"

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid!"
    
    # Reload nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    
    echo "🎉 Family Bookkeeping API routing is now active!"
    echo "📍 Test URL: https://api.mywaitime.com/family-api/auth/register/"
else
    echo "❌ Nginx configuration has errors!"
    echo "🔄 Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/default
    exit 1
fi
