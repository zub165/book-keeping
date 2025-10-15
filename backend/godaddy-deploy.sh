#!/bin/bash

# GoDaddy Deployment Script for Family Bookkeeping Backend

echo "🚀 Preparing Family Bookkeeping Backend for GoDaddy Deployment..."

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf family-bookkeeping-backend.tar.gz \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.git' \
    --exclude='venv' \
    --exclude='.env' \
    --exclude='db.sqlite3' \
    .

echo "✅ Deployment package created: family-bookkeeping-backend.tar.gz"
echo ""
echo "📋 Next steps for GoDaddy deployment:"
echo "1. Upload family-bookkeeping-backend.tar.gz to your GoDaddy server"
echo "2. Extract the files: tar -xzf family-bookkeeping-backend.tar.gz"
echo "3. Install dependencies: pip install -r requirements.txt"
echo "4. Run migrations: python manage.py migrate"
echo "5. Create superuser: python manage.py createsuperuser"
echo "6. Collect static files: python manage.py collectstatic"
echo "7. Update your GoDaddy server configuration"
echo ""
echo "🌐 Your Family Bookkeeping API will be available at:"
echo "   http://208.109.215.53:3015/api/"
