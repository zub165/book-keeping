# 🚨 QUICK FIX: GoDaddy Backend Update

## **THE PROBLEM:**
- Frontend is updated ✅
- Backend on GoDaddy is NOT updated ❌
- 500 Internal Server Error when adding family members
- Missing email field in database

## **THE SOLUTION:**
Update your GoDaddy server with the new Django code.

---

## 🚀 **QUICK DEPLOYMENT STEPS:**

### **Step 1: SSH into GoDaddy Server**
```bash
ssh your-username@208.109.215.53
```

### **Step 2: Navigate to Django Project**
```bash
# Find your Django project directory
cd /path/to/your/django/project
# OR check PM2 processes
pm2 list
```

### **Step 3: Update These Files**

#### **A. Update `api/models.py`**
Add these lines to the `FamilyMember` model:
```python
email = models.EmailField(blank=True, null=True, help_text="Email for sending registration invites")
is_registered = models.BooleanField(default=False, help_text="Whether this family member has registered")
```

#### **B. Update `api/serializers.py`**
Change the `FamilyMemberSerializer` fields to:
```python
fields = ['id', 'name', 'relation', 'email', 'is_registered', 'created_at', 'updated_at']
```

#### **C. Update `api/views.py`**
Add this function:
```python
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

#### **D. Update `api/urls.py`**
Add this line to the urlpatterns:
```python
path('auth/refresh/', views.refresh_token, name='refresh_token'),
```

### **Step 4: Apply Database Migration**
```bash
# Create migration
python3 manage.py makemigrations api

# Apply migration
python3 manage.py migrate
```

### **Step 5: Restart Django**
```bash
# If using PM2
pm2 restart django-app

# If running manually
pkill -f "python.*manage.py.*runserver"
nohup python3 manage.py runserver 0.0.0.0:3017 &
```

---

## ✅ **VERIFICATION:**

### **Test 1: Check API Endpoint**
```bash
curl https://api.mywaitime.com/family-api/family-members/
```

### **Test 2: Check Refresh Endpoint**
```bash
curl -X POST https://api.mywaitime.com/family-api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"test"}'
```

### **Test 3: Frontend Test**
1. Go to: https://zub165.github.io/book-keeping/
2. Login with your credentials
3. Click "Add Family Member"
4. Add "Muhammad Abdullah" with email
5. Should work without 500 error!

---

## 🆘 **IF SOMETHING GOES WRONG:**

### **Rollback Database:**
```bash
# Restore from backup
cp db.sqlite3.backup.* db.sqlite3
```

### **Check Logs:**
```bash
# PM2 logs
pm2 logs django-app

# Django check
python3 manage.py check
```

---

## 🎯 **EXPECTED RESULT:**

After deployment:
- ✅ No more 500 Internal Server Error
- ✅ Email field works in "Add Family Member"
- ✅ "Muhammad Abdullah" can be added successfully
- ✅ JWT token refresh works
- ✅ Registration status tracking works

**This should fix the 500 error and enable all the new email functionality!** 🚀
