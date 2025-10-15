# 🚀 GODADDY BACKEND UPDATE GUIDE

## 🎯 **OBJECTIVE:**
Update your GoDaddy server with the latest Django backend changes to fix the 500 Internal Server Error when adding family members.

---

## 📋 **PRE-DEPLOYMENT CHECKLIST:**

### **Files to Update on GoDaddy Server:**
- ✅ `backend/api/models.py` (new email and is_registered fields)
- ✅ `backend/api/serializers.py` (updated serializer)
- ✅ `backend/api/views.py` (refresh token endpoint)
- ✅ `backend/api/urls.py` (refresh endpoint)
- ✅ `backend/api/migrations/` (new migration files)

---

## 🛠️ **STEP-BY-STEP DEPLOYMENT:**

### **Step 1: Access Your GoDaddy Server**
```bash
# SSH into your GoDaddy server
ssh your-username@208.109.215.53
```

### **Step 2: Navigate to Django Project**
```bash
# Navigate to your Django project directory
cd /path/to/your/django/project
# OR if using PM2, find the project directory
pm2 list
```

### **Step 3: Backup Current Database**
```bash
# Backup the current database
cp db.sqlite3 db.sqlite3.backup.$(date +%Y%m%d_%H%M%S)
```

### **Step 4: Update Code Files**

#### **Option A: Upload Files via SCP (Recommended)**
From your local machine:
```bash
# Upload updated files to GoDaddy server
scp backend/api/models.py your-username@208.109.215.53:/path/to/django/project/api/
scp backend/api/serializers.py your-username@208.109.215.53:/path/to/django/project/api/
scp backend/api/views.py your-username@208.109.215.53:/path/to/django/project/api/
scp backend/api/urls.py your-username@208.109.215.53:/path/to/django/project/api/
```

#### **Option B: Manual File Update**
Create the files directly on the server with the updated content.

### **Step 5: Apply Database Migration**
```bash
# Apply the new migration
python3 manage.py migrate

# Verify migration was applied
python3 manage.py showmigrations api
```

### **Step 6: Restart Django Application**
```bash
# If using PM2
pm2 restart django-app
# OR
pm2 restart all

# If using systemd
sudo systemctl restart django
# OR
sudo service django restart

# If running manually
# Kill the current process and restart
pkill -f "python.*manage.py.*runserver"
nohup python3 manage.py runserver 0.0.0.0:3017 &
```

### **Step 7: Verify Deployment**
```bash
# Test the API endpoints
curl -X GET https://api.mywaitime.com/family-api/family-members/
curl -X POST https://api.mywaitime.com/family-api/auth/refresh/ -H "Content-Type: application/json" -d '{"refresh":"test"}'
```

---

## 📁 **FILES TO UPDATE:**

### **1. backend/api/models.py**
```python
# Add these fields to FamilyMember model:
email = models.EmailField(blank=True, null=True, help_text="Email for sending registration invites")
is_registered = models.BooleanField(default=False, help_text="Whether this family member has registered")
```

### **2. backend/api/serializers.py**
```python
# Update FamilyMemberSerializer fields:
fields = ['id', 'name', 'relation', 'email', 'is_registered', 'created_at', 'updated_at']
```

### **3. backend/api/views.py**
```python
# Add refresh_token function:
@api_view(['POST'])
def refresh_token(request):
    """Refresh JWT token endpoint"""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        new_access_token = str(refresh.access_token)
        return Response({'access': new_access_token})
    except Exception as e:
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
```

### **4. backend/api/urls.py**
```python
# Add refresh endpoint:
path('auth/refresh/', views.refresh_token, name='refresh_token'),
```

---

## 🔍 **TROUBLESHOOTING:**

### **If Migration Fails:**
```bash
# Check migration status
python3 manage.py showmigrations

# If needed, create migration manually
python3 manage.py makemigrations api

# Apply migration
python3 manage.py migrate
```

### **If Server Won't Start:**
```bash
# Check Django logs
tail -f /var/log/django.log
# OR
pm2 logs django-app

# Check for syntax errors
python3 manage.py check
```

### **If Database Issues:**
```bash
# Reset migrations (CAUTION: This will lose data)
python3 manage.py migrate api zero
python3 manage.py migrate api

# Or restore from backup
cp db.sqlite3.backup.* db.sqlite3
```

---

## ✅ **VERIFICATION CHECKLIST:**

After deployment, verify these work:
- [ ] Family member creation with email field
- [ ] JWT token refresh endpoint
- [ ] No more 500 Internal Server Error
- [ ] Frontend can add "Muhammad Abdullah" successfully
- [ ] Email field appears in family member dropdown

---

## 🆘 **EMERGENCY ROLLBACK:**

If something goes wrong:
```bash
# Restore database backup
cp db.sqlite3.backup.* db.sqlite3

# Restore old code files
# (Upload previous versions)

# Restart application
pm2 restart django-app
```

---

## 📞 **SUPPORT:**

If you encounter issues:
1. Check Django logs: `pm2 logs django-app`
2. Verify database: `python3 manage.py dbshell`
3. Test API endpoints with curl
4. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

**The deployment should fix the 500 error and enable email functionality for family members!** 🚀
