#!/bin/bash

# Family Bookkeeping Application Setup Script

echo "🚀 Setting up Family Bookkeeping Application..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Create virtual environment for backend
echo "📦 Setting up Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run Django migrations
echo "🗄️ Setting up database..."
python manage.py migrate

# Create superuser
echo "👤 Creating superuser account..."
echo "Please create a superuser account for Django admin:"
python manage.py createsuperuser

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd ..
npm install

# Create environment file
echo "⚙️ Creating environment configuration..."
cp backend/env.example backend/.env

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && python manage.py runserver"
echo "2. Frontend: npm start"
echo ""
echo "Or use Docker: docker-compose up -d"
echo ""
echo "Access the application at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000/api/"
echo "- Admin: http://localhost:8000/admin/"
