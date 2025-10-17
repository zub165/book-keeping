#!/bin/bash

echo "🚀 Starting Django Family Bookkeeping Development Server"

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run ./scripts/dev_setup.sh first."
    exit 1
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Load development environment
echo "🔧 Loading development environment..."
export $(cat env.development | grep -v '^#' | xargs)

# Set Django settings module
export DJANGO_SETTINGS_MODULE=bookkeeping.settings

# Check if database exists
if [ ! -f "db.sqlite3" ]; then
    echo "🗄️ Database not found. Running migrations..."
    python manage.py migrate
fi

# Start development server
echo "🌐 Starting development server on http://localhost:3017"
echo "👤 Admin login: admin / admin123"
echo "📊 API endpoints: http://localhost:3017/api/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python manage.py runserver 0.0.0.0:3017
