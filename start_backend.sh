#!/bin/bash

echo "🚀 Starting Django Backend Server"

# Kill any existing processes on port 3017
echo "🔍 Checking for existing processes on port 3017..."
PIDS=$(lsof -ti:3017)
if [ ! -z "$PIDS" ]; then
    echo "⚠️ Found existing processes on port 3017: $PIDS"
    echo "🔄 Killing existing processes..."
    kill -9 $PIDS
    sleep 2
fi

# Verify port is free
if lsof -ti:3017 > /dev/null 2>&1; then
    echo "❌ Port 3017 is still in use. Please check manually."
    exit 1
fi

echo "✅ Port 3017 is now free"

# Navigate to backend directory
cd backend

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Load environment variables
echo "🔧 Loading development environment..."
export $(cat env.development | grep -v '^#' | xargs)

# Start Django server
echo "🌐 Starting Django server on http://localhost:3017"
echo "📊 API endpoints available at: http://localhost:3017/api/"
echo "👤 Admin interface: http://localhost:3017/admin/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python manage.py runserver 0.0.0.0:3017
