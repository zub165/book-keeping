#!/bin/bash

# GoDaddy Server Deployment Script
# Run this script on your GoDaddy server

echo "🚀 Starting Family Bookkeeping Backend Update..."

# Navigate to the Django project directory
cd /home/newgen/hospitalfinder/family_bookkeeping

echo "📁 Current directory: $(pwd)"

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install new Python packages
echo "📦 Installing new Python packages..."
pip install openpyxl>=3.1.0 pandas>=2.0.0 python-dateutil>=2.8.0

# Run database migrations
echo "🗄️ Running database migrations..."
python3 manage.py makemigrations api
python3 manage.py migrate

# Restart PM2 processes
echo "🔄 Restarting PM2 processes..."
pm2 restart all

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Test the API endpoints
echo "🧪 Testing API endpoints..."
curl -s http://localhost:3017/api/family-members/ | head -c 100
echo ""

echo "✅ Deployment completed successfully!"
echo "🎯 Your backend should now be updated with:"
echo "   - Email field support for family members"
echo "   - AI-powered tax categorization"
echo "   - Excel/CSV import/export functionality"
echo "   - 24-hour JWT tokens"
