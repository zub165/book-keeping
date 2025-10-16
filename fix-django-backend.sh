#!/bin/bash

echo "🔧 COMPREHENSIVE DJANGO BACKEND FIX SCRIPT"
echo "=========================================="

# Navigate to Django project
cd /home/newgen/hospitalfinder/family_bookkeeping

echo "📁 Current directory: $(pwd)"

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update Python packages
echo "📦 Installing Python packages..."
pip install openpyxl>=3.1.0 pandas>=2.0.0 python-dateutil>=2.8.0

# Run database migrations
echo "🗄️ Running database migrations..."
python3 manage.py makemigrations api
python3 manage.py migrate

# Check Django configuration
echo "⚙️ Checking Django configuration..."
python3 manage.py check

# Test Django server locally
echo "🧪 Testing Django server..."
python3 manage.py runserver 0.0.0.0:3017 &
DJANGO_PID=$!
sleep 5

# Test local connection
echo "🔍 Testing local API connection..."
curl -s http://localhost:3017/api/auth/register/ | head -c 100
echo ""

# Stop test server
kill $DJANGO_PID 2>/dev/null

# Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart family-bookkeeping-backend

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status | grep family-bookkeeping

# Test external API connection
echo "🌐 Testing external API connection..."
curl -s https://api.mywaitime.com/family-api/auth/register/ | head -c 100
echo ""

# Check Nginx configuration
echo "🔧 Checking Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Django backend fix completed!"
echo "🎯 Test your frontend at: https://zub165.github.io/book-keeping/"
