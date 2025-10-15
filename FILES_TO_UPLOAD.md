# 📁 FILES TO UPLOAD TO GODADDY SERVER

## **6 CRITICAL FILES NEEDED:**

### **1. `backend/api/models.py`**
**Location**: `backend/api/models.py`
**Purpose**: Adds email field to FamilyMember model
**Critical**: Fixes 500 error on family member creation

### **2. `backend/api/serializers.py`**
**Location**: `backend/api/serializers.py`
**Purpose**: Updated serializer with email field
**Critical**: Enables email field in API responses

### **3. `backend/api/views.py`**
**Location**: `backend/api/views.py`
**Purpose**: Adds AI export/import functions
**Critical**: Enables Excel/CSV export and AI tax analysis

### **4. `backend/api/urls.py`**
**Location**: `backend/api/urls.py`
**Purpose**: Adds new API endpoints
**Critical**: Enables export/import/tax-report endpoints

### **5. `backend/requirements.txt`**
**Location**: `backend/requirements.txt`
**Purpose**: Adds new Python packages
**Critical**: Enables pandas, openpyxl for Excel processing

### **6. `backend/api/migrations/0002_familymember_email_familymember_is_registered.py`**
**Location**: `backend/api/migrations/0002_familymember_email_familymember_is_registered.py`
**Purpose**: Database migration for email field
**Critical**: Updates database schema

---

## 🚀 **UPLOAD METHODS:**

### **Method 1: SSH + SCP (Recommended)**
```bash
# From your local machine
scp backend/api/models.py your-username@208.109.215.53:/path/to/django/project/api/
scp backend/api/serializers.py your-username@208.109.215.53:/path/to/django/project/api/
scp backend/api/views.py your-username@208.109.215.53:/path/to/django/project/api/
scp backend/api/urls.py your-username@208.109.215.53:/path/to/django/project/api/
scp backend/requirements.txt your-username@208.109.215.53:/path/to/django/project/
scp backend/api/migrations/0002_familymember_email_familymember_is_registered.py your-username@208.109.215.53:/path/to/django/project/api/migrations/
```

### **Method 2: GoDaddy File Manager**
1. Login to GoDaddy cPanel
2. Open File Manager
3. Navigate to your Django project
4. Upload each file to correct location

### **Method 3: FTP Client**
1. Use FileZilla or similar
2. Connect to your server
3. Upload files to correct directories

---

## ⚡ **QUICK COMMANDS AFTER UPLOAD:**

```bash
# SSH into server
ssh your-username@208.109.215.53

# Navigate to project
cd /path/to/your/django/project

# Install new packages
pip install openpyxl>=3.1.0 pandas>=2.0.0 python-dateutil>=2.8.0

# Apply migration
python3 manage.py migrate

# Restart server
pm2 restart django-app
```

---

## ✅ **VERIFICATION:**

After upload, test these endpoints:
- `https://api.mywaitime.com/family-api/export/` (should not be 404)
- `https://api.mywaitime.com/family-api/import/` (should not be 404)
- `https://api.mywaitime.com/family-api/tax-report/` (should not be 404)

**Once these 6 files are uploaded and migration is applied, your 500 errors will be fixed and AI features will work!** 🚀
