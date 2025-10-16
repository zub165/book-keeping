#!/bin/bash

echo "🔧 Fixing CORS duplicate headers issue..."

# Backup current nginx config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Create a clean nginx configuration for family-api
sudo tee /tmp/family-api-nginx.conf > /dev/null << 'EOF'
# Family Bookkeeping API routing - FIXED CORS
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
    
    # Handle preflight requests FIRST (before other CORS headers)
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://zub165.github.io' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    # CORS headers for GitHub Pages (ONLY for non-OPTIONS requests)
    add_header 'Access-Control-Allow-Origin' 'https://zub165.github.io' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
}
EOF

# Remove the old family-api location block
sudo sed -i '/# Family Bookkeeping API routing/,/^}/d' /etc/nginx/sites-available/default

# Add the new clean configuration
sudo cat /tmp/family-api-nginx.conf >> /etc/nginx/sites-available/default

echo "✅ Nginx configuration updated!"

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid!"
    
    # Reload nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    
    echo "🎉 CORS issue fixed!"
    echo "📍 Test URL: https://api.mywaitime.com/family-api/auth/login/"
else
    echo "❌ Nginx configuration has errors!"
    echo "🔄 Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/default
    exit 1
fi

# Clean up temp file
rm -f /tmp/family-api-nginx.conf

echo "✅ CORS fix completed!"
