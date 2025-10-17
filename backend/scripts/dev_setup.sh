#!/bin/bash

echo "🚀 Setting up Django Family Bookkeeping Backend for Local Development"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing development dependencies..."
pip install -r requirements/development.txt

# Load environment variables
echo "🔧 Loading development environment..."
export $(cat env.development | grep -v '^#' | xargs)

# Set Django settings module
export DJANGO_SETTINGS_MODULE=bookkeeping.settings

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "👤 Creating superuser (if not exists)..."
python manage.py shell << EOF
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF

# Load sample data
echo "📊 Loading sample data..."
python manage.py setup_dev_data

# Create static files directory
echo "📁 Creating static files directory..."
mkdir -p staticfiles

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Development setup completed successfully!"
echo ""
echo "🎯 To start the development server:"
echo "   source venv/bin/activate"
echo "   export \$(cat env.development | grep -v '^#' | xargs)"
echo "   python manage.py runserver 0.0.0.0:3017"
echo ""
echo "🌐 Server will be available at: http://localhost:3017"
echo "👤 Admin login: admin / admin123"
