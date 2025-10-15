# GoDaddy Server Deployment Guide

## 🚀 Frontend Deployment to GitHub Pages

### Step 1: Update Configuration
1. Edit `public/js/config.js`
2. Replace `your-godaddy-domain.com` with your actual GoDaddy domain:
```javascript
API_BASE_URL: 'https://your-actual-domain.com/api'
```

### Step 2: Deploy to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your GitHub repository
2. Click "Settings" → "Pages"
3. Source: "Deploy from a branch"
4. Branch: "main" → "/ (root)"
5. Save

### Step 4: Configure GoDaddy Backend

#### Update Django Settings for Production
```python
# In your GoDaddy Django settings
ALLOWED_HOSTS = [
    'your-domain.com',
    'yourusername.github.io',  # Your GitHub Pages domain
    'localhost',
    '127.0.0.1'
]

CORS_ALLOWED_ORIGINS = [
    "https://yourusername.github.io",  # Your GitHub Pages URL
    "http://localhost:3000",
    "http://localhost:3001"
]
```

#### Install Required Packages on GoDaddy
```bash
pip install django-cors-headers
pip install djangorestframework
pip install djangorestframework-simplejwt
```

#### Update GoDaddy Django URLs
Make sure your `urls.py` includes:
```python
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
```

### Step 5: Test the Integration
1. Your frontend will be at: `https://yourusername.github.io/your-repo`
2. Your backend API will be at: `https://your-domain.com/api`
3. Test registration and login to ensure they work together

### Step 6: SSL Configuration
Make sure your GoDaddy server has SSL enabled:
- GoDaddy usually provides free SSL certificates
- Ensure your Django app runs on HTTPS
- Update your frontend config to use HTTPS URLs

## 🔧 GoDaddy Server Setup

### Django Deployment on GoDaddy
1. **Upload your Django project** to your GoDaddy hosting
2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run migrations**:
   ```bash
   python manage.py migrate
   ```
4. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```
5. **Collect static files**:
   ```bash
   python manage.py collectstatic
   ```

### Environment Variables on GoDaddy
Create a `.env` file on your GoDaddy server:
```env
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,yourusername.github.io
```

## 🌐 Final URLs
- **Frontend**: `https://yourusername.github.io/your-repo`
- **Backend API**: `https://your-domain.com/api`
- **Admin**: `https://your-domain.com/admin`

## 🔒 Security Notes
1. **CORS Configuration**: Make sure to allow your GitHub Pages domain
2. **HTTPS Only**: Use HTTPS for all communications
3. **Environment Variables**: Keep sensitive data in environment variables
4. **Database**: Use a production database (PostgreSQL recommended)

## 📞 Support
If you need help with GoDaddy-specific configuration, check:
- GoDaddy's Python hosting documentation
- Django deployment guides for shared hosting
- CORS configuration for cross-origin requests
