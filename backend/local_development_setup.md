# Django Backend - Local Development & Deployment Setup

## 🚀 **Current Setup Analysis**

### **✅ What You Have:**
- **Django Backend** - Already configured
- **SQLite Database** - Local development database
- **REST API** - Django REST Framework
- **JWT Authentication** - Secure user authentication
- **CORS Configuration** - Frontend integration
- **Family Bookkeeping Models** - Expenses, Miles, Hours, Family Members

### **🎯 Optimization Goals:**
- **Local Development** - Easy setup and testing
- **Production Ready** - Optimized for deployment
- **Database Management** - SQLite for local, PostgreSQL for production
- **Environment Configuration** - Separate dev/prod settings
- **Deployment Scripts** - Automated deployment to GoDaddy VPS

---

## 🛠️ **Local Development Setup**

### **1. Environment Configuration**

Create environment-specific settings:

```python
# backend/bookkeeping/settings/
# __init__.py
import os
from .base import *

if os.environ.get('DJANGO_ENV') == 'production':
    from .production import *
else:
    from .development import *
```

```python
# backend/bookkeeping/settings/base.py
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Common settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'bookkeeping.urls'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

```python
# backend/bookkeeping/settings/development.py
from .base import *

# Development settings
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# SQLite for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS for local development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3017",
    "http://127.0.0.1:3017",
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Logging for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
```

```python
# backend/bookkeeping/settings/production.py
from .base import *

# Production settings
DEBUG = False
ALLOWED_HOSTS = [
    'your-domain.com',
    'your-vps-ip',
    'localhost',
    '127.0.0.1',
]

# PostgreSQL for production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'family_bookkeeping'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# CORS for production
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
    "https://www.your-domain.com",
]

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@your-domain.com')

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = '/var/www/media/'

# Logging for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/family_bookkeeping.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
```

### **2. Environment Variables**

```bash
# backend/.env.development
DEBUG=True
SECRET_KEY=django-insecure-change-this-in-development
DJANGO_ENV=development
DB_NAME=family_bookkeeping_dev
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=noreply@your-domain.com
```

```bash
# backend/.env.production
DEBUG=False
SECRET_KEY=your-super-secret-production-key
DJANGO_ENV=production
DB_NAME=family_bookkeeping_prod
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=noreply@your-domain.com
```

### **3. Requirements Management**

```txt
# backend/requirements/base.txt
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.1
python-decouple==3.8
Pillow==10.1.0
```

```txt
# backend/requirements/development.txt
-r base.txt
django-debug-toolbar==4.2.0
django-extensions==3.2.3
factory-boy==3.3.0
pytest==7.4.3
pytest-django==4.7.0
coverage==7.3.2
```

```txt
# backend/requirements/production.txt
-r base.txt
psycopg2-binary==2.9.9
gunicorn==21.2.0
whitenoise==6.6.0
django-storages==1.14.2
boto3==1.34.0
```

### **4. Local Development Scripts**

```bash
# backend/scripts/dev_setup.sh
#!/bin/bash

echo "🚀 Setting up Django Family Bookkeeping Backend for Local Development"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements/development.txt

# Load environment variables
export $(cat .env.development | xargs)

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data
python manage.py loaddata fixtures/sample_data.json

# Start development server
python manage.py runserver 0.0.0.0:3017

echo "✅ Development server started at http://localhost:3017"
```

```bash
# backend/scripts/start_dev.sh
#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Load development environment
export $(cat .env.development | xargs)

# Start development server
python manage.py runserver 0.0.0.0:3017
```

### **5. Database Management**

```python
# backend/api/management/commands/setup_dev_data.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import FamilyMember, Expense, Mile, Hour
from decimal import Decimal
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Setup development data for local testing'

    def handle(self, *args, **options):
        # Create test users
        users = []
        for i in range(3):
            user, created = User.objects.get_or_create(
                username=f'testuser{i+1}',
                defaults={
                    'email': f'testuser{i+1}@example.com',
                    'first_name': f'Test User {i+1}',
                    'last_name': 'Family',
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
            users.append(user)

        # Create family members
        family_members = []
        for i, user in enumerate(users):
            member, created = FamilyMember.objects.get_or_create(
                user=user,
                name=f'{user.first_name} {user.last_name}',
                relation='Self' if i == 0 else 'Child',
                defaults={
                    'email': user.email,
                    'role': 'admin' if i == 0 else 'member',
                    'can_view_all': i == 0,
                }
            )
            family_members.append(member)

        # Create sample expenses
        categories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare']
        for _ in range(50):
            Expense.objects.create(
                family_member=random.choice(family_members),
                description=f'Sample expense {random.randint(1, 100)}',
                amount=Decimal(str(random.uniform(10, 500))),
                category=random.choice(categories),
                date=datetime.now() - timedelta(days=random.randint(1, 365)),
            )

        # Create sample miles
        for _ in range(20):
            Mile.objects.create(
                family_member=random.choice(family_members),
                description=f'Business trip {random.randint(1, 50)}',
                miles=random.uniform(10, 200),
                rate=Decimal('0.65'),
                date=datetime.now() - timedelta(days=random.randint(1, 365)),
            )

        # Create sample hours
        for _ in range(30):
            Hour.objects.create(
                family_member=random.choice(family_members),
                description=f'Work hours {random.randint(1, 30)}',
                hours=random.uniform(1, 12),
                rate=Decimal(str(random.uniform(15, 75))),
                date=datetime.now() - timedelta(days=random.randint(1, 365)),
            )

        self.stdout.write(
            self.style.SUCCESS('✅ Development data created successfully!')
        )
```

---

## 🚀 **Deployment Preparation**

### **1. Production Database Setup**

```bash
# Install PostgreSQL on GoDaddy VPS
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE family_bookkeeping_prod;
CREATE USER family_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE family_bookkeeping_prod TO family_user;
\q
```

### **2. Deployment Scripts**

```bash
# backend/scripts/deploy.sh
#!/bin/bash

echo "🚀 Deploying Django Family Bookkeeping Backend to GoDaddy VPS"

# Server configuration
SERVER="your-vps-ip"
USER="root"
APP_DIR="/opt/family-bookkeeping"
BACKUP_DIR="/opt/backups"

# Create backup
echo "📦 Creating backup..."
ssh $USER@$SERVER "mkdir -p $BACKUP_DIR"
ssh $USER@$SERVER "cp -r $APP_DIR $BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S)"

# Upload code
echo "📤 Uploading code..."
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '*.pyc' \
    ./ $USER@$SERVER:$APP_DIR/

# Install dependencies
echo "📦 Installing dependencies..."
ssh $USER@$SERVER "cd $APP_DIR && pip install -r requirements/production.txt"

# Run migrations
echo "🗄️ Running migrations..."
ssh $USER@$SERVER "cd $APP_DIR && python manage.py migrate"

# Collect static files
echo "📁 Collecting static files..."
ssh $USER@$SERVER "cd $APP_DIR && python manage.py collectstatic --noinput"

# Restart services
echo "🔄 Restarting services..."
ssh $USER@$SERVER "systemctl restart family-bookkeeping"
ssh $USER@$SERVER "systemctl restart nginx"

echo "✅ Deployment completed successfully!"
```

### **3. Systemd Service**

```ini
# /etc/systemd/system/family-bookkeeping.service
[Unit]
Description=Family Bookkeeping Django App
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/opt/family-bookkeeping
Environment=DJANGO_ENV=production
ExecStart=/opt/family-bookkeeping/venv/bin/gunicorn --bind 0.0.0.0:8000 bookkeeping.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### **4. Nginx Configuration**

```nginx
# /etc/nginx/sites-available/family-bookkeeping
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /opt/family-bookkeeping/staticfiles/;
    }

    location /media/ {
        alias /opt/family-bookkeeping/media/;
    }
}
```

---

## 🎯 **Quick Start Commands**

### **Local Development:**
```bash
# Setup development environment
cd backend
chmod +x scripts/dev_setup.sh
./scripts/dev_setup.sh

# Start development server
chmod +x scripts/start_dev.sh
./scripts/start_dev.sh
```

### **Production Deployment:**
```bash
# Deploy to GoDaddy VPS
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## ✅ **Summary**

**Your Django backend is now optimized for:**

1. **✅ Local Development** - Easy setup and testing
2. **✅ Production Ready** - Optimized for GoDaddy VPS deployment
3. **✅ Database Management** - SQLite for local, PostgreSQL for production
4. **✅ Environment Configuration** - Separate dev/prod settings
5. **✅ Automated Deployment** - One-command deployment
6. **✅ Family Bookkeeping Features** - All your existing functionality

**Ready to run locally and deploy to your GoDaddy VPS!** 🎉✨
