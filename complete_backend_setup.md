# Complete Backend Setup on GoDaddy VPS (No Database Purchase Needed)

## 🎯 **What You Get with GoDaddy VPS + PocketBase**

### **✅ Everything Included (No Additional Costs):**
- **Database**: SQLite (built-in with PocketBase)
- **REST API**: Auto-generated endpoints
- **Authentication**: User management system
- **File Storage**: Receipt images and documents
- **Real-time**: WebSocket subscriptions
- **Admin UI**: Web-based data management
- **Backup**: Automated database backups

### **💰 Total Cost:**
- **GoDaddy VPS**: $5-10/month (what you already have)
- **Database**: $0 (SQLite included)
- **API**: $0 (auto-generated)
- **Storage**: $0 (VPS disk space)
- **Total**: Only your VPS cost!

---

## 🛠️ **Step-by-Step Backend Setup**

### **1. Connect to Your GoDaddy VPS**
```bash
# SSH into your VPS
ssh root@your-vps-ip-address
# or
ssh username@your-vps-ip-address
```

### **2. Install PocketBase (Complete Backend)**
```bash
# Create app directory
sudo mkdir -p /opt/family-bookkeeping
cd /opt/family-bookkeeping

# Download PocketBase (single file backend)
sudo wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip

# Extract
sudo unzip pocketbase_linux_amd64.zip

# Make executable
sudo chmod +x pocketbase

# Test run (this creates your database automatically!)
sudo ./pocketbase serve --http=0.0.0.0:8090
```

### **3. Access Your Backend Admin**
- Open browser: `http://your-vps-ip:8090/_/`
- Create admin account
- **Your database is ready!** (SQLite created automatically)

### **4. Create Database Tables (Collections)**
```json
// Users Collection (Authentication)
{
  "name": "users",
  "type": "auth",
  "schema": [
    {"name": "name", "type": "text", "required": true},
    {"name": "phone", "type": "text"},
    {"name": "subscription_plan", "type": "select", "options": {"values": ["free", "premium", "family"]}}
  ]
}

// Families Collection
{
  "name": "families",
  "schema": [
    {"name": "name", "type": "text", "required": true},
    {"name": "owner_id", "type": "relation", "options": {"collectionId": "users"}},
    {"name": "plan", "type": "select", "options": {"values": ["free", "premium", "family"]}}
  ]
}

// Expenses Collection
{
  "name": "expenses",
  "schema": [
    {"name": "description", "type": "text", "required": true},
    {"name": "amount", "type": "number", "required": true},
    {"name": "category", "type": "text", "required": true},
    {"name": "date", "type": "date", "required": true},
    {"name": "user_id", "type": "relation", "options": {"collectionId": "users"}},
    {"name": "family_id", "type": "relation", "options": {"collectionId": "families"}},
    {"name": "receipt", "type": "file", "options": {"maxSelect": 1, "maxSize": 10485760}}
  ]
}

// Miles Collection
{
  "name": "miles",
  "schema": [
    {"name": "description", "type": "text", "required": true},
    {"name": "miles", "type": "number", "required": true},
    {"name": "rate", "type": "number", "required": true},
    {"name": "date", "type": "date", "required": true},
    {"name": "user_id", "type": "relation", "options": {"collectionId": "users"}},
    {"name": "family_id", "type": "relation", "options": {"collectionId": "families"}}
  ]
}

// Hours Collection
{
  "name": "hours",
  "schema": [
    {"name": "description", "type": "text", "required": true},
    {"name": "hours", "type": "number", "required": true},
    {"name": "rate", "type": "number", "required": true},
    {"name": "date", "type": "date", "required": true},
    {"name": "user_id", "type": "relation", "options": {"collectionId": "users"}},
    {"name": "family_id", "type": "relation", "options": {"collectionId": "families"}}
  ]
}
```

---

## 🔧 **Production Setup (Optional)**

### **1. Create System Service**
```bash
# Create service file
sudo nano /etc/systemd/system/family-bookkeeping.service
```

```ini
[Unit]
Description=Family Bookkeeping Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/family-bookkeeping
ExecStart=/opt/family-bookkeeping/pocketbase serve --http=0.0.0.0:8090
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable family-bookkeeping
sudo systemctl start family-bookkeeping
sudo systemctl status family-bookkeeping
```

### **2. Setup Nginx Reverse Proxy (Optional)**
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/family-bookkeeping
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/family-bookkeeping /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📱 **Flutter App Integration**

### **1. Add PocketBase to Flutter**
```yaml
# pubspec.yaml
dependencies:
  pocketbase: ^0.1.0
```

### **2. Configure Your App**
```dart
// lib/core/config/app_config.dart
class AppConfig {
  // Your GoDaddy VPS URL
  static const String backendUrl = 'http://your-vps-ip:8090';
  // or with domain: 'https://your-domain.com'
  
  static final PocketBase pb = PocketBase(backendUrl);
}
```

### **3. Authentication**
```dart
// Login
final authData = await AppConfig.pb.collection('users').authWithPassword(
  email: email,
  password: password,
);

// Register
final user = await AppConfig.pb.collection('users').create({
  'email': email,
  'password': password,
  'passwordConfirm': password,
  'name': name,
});
```

### **4. CRUD Operations**
```dart
// Create expense
final expense = await AppConfig.pb.collection('expenses').create({
  'description': 'Gas Station',
  'amount': 25.50,
  'category': 'Transportation',
  'date': DateTime.now().toIso8601String(),
  'user_id': userId,
  'family_id': familyId,
});

// Get expenses
final expenses = await AppConfig.pb.collection('expenses').getList(
  filter: 'family_id = "$familyId"',
  sort: '-date',
);

// Update expense
await AppConfig.pb.collection('expenses').update(expenseId, {
  'amount': 30.00,
});

// Delete expense
await AppConfig.pb.collection('expenses').delete(expenseId);
```

### **5. Real-time Updates**
```dart
// Subscribe to expense changes
AppConfig.pb.collection('expenses').subscribe('*', (e) {
  print('Expense updated: ${e.record.data}');
  // Update UI for all family members
  updateExpenseList(e.record.data);
});
```

---

## 💾 **Database Management (No Additional Cost)**

### **Automatic Database Features:**
- ✅ **SQLite database** - Created automatically
- ✅ **Unlimited records** - No row limits
- ✅ **Fast queries** - Local database performance
- ✅ **Easy backup** - Single file backup
- ✅ **No maintenance** - PocketBase handles everything

### **Backup Your Database:**
```bash
# Create backup script
sudo nano /opt/family-bookkeeping/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/family-bookkeeping/backups"
mkdir -p $BACKUP_DIR

# Backup SQLite database
cp /opt/family-bookkeeping/data.db $BACKUP_DIR/family_bookkeeping_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "family_bookkeeping_*.db" -mtime +7 -delete

echo "Backup completed: family_bookkeeping_$DATE.db"
```

```bash
# Make executable
sudo chmod +x /opt/family-bookkeeping/backup.sh

# Daily backup at 2 AM
sudo crontab -e
# Add: 0 2 * * * /opt/family-bookkeeping/backup.sh
```

---

## 📊 **What You Get (Complete Backend)**

### **Database Features:**
- ✅ **SQLite database** - Fast and reliable
- ✅ **Unlimited storage** - Within your VPS disk space
- ✅ **Unlimited records** - No row limits
- ✅ **Fast queries** - Local database performance
- ✅ **Easy backup** - Single file backup

### **API Features:**
- ✅ **REST API** - Auto-generated endpoints
- ✅ **CRUD operations** - Create, Read, Update, Delete
- ✅ **Filtering** - Query with conditions
- ✅ **Sorting** - Order results
- ✅ **Pagination** - Handle large datasets

### **Authentication Features:**
- ✅ **User registration** - Create accounts
- ✅ **User login** - Secure authentication
- ✅ **Password reset** - Email-based reset
- ✅ **Role management** - User permissions
- ✅ **Session management** - Secure sessions

### **Real-time Features:**
- ✅ **WebSocket subscriptions** - Live updates
- ✅ **Real-time sync** - All family members see changes instantly
- ✅ **Event handling** - Create, update, delete events
- ✅ **Connection management** - Automatic reconnection

### **File Storage Features:**
- ✅ **File upload** - Receipt images
- ✅ **File download** - Access stored files
- ✅ **File management** - Organize files
- ✅ **File security** - Access control

### **Admin Features:**
- ✅ **Web admin UI** - Manage data visually
- ✅ **User management** - Add/edit users
- ✅ **Data management** - View/edit all data
- ✅ **System monitoring** - Check system status
- ✅ **Backup management** - Create/restore backups

---

## 💰 **Cost Breakdown**

### **What You Pay:**
- **GoDaddy VPS**: $5-10/month (what you already have)
- **Database**: $0 (SQLite included)
- **API**: $0 (auto-generated)
- **Storage**: $0 (VPS disk space)
- **Authentication**: $0 (built-in)
- **File storage**: $0 (VPS disk space)
- **Real-time**: $0 (WebSocket included)
- **Admin UI**: $0 (web-based)

### **Total Monthly Cost:**
- **Only your VPS cost**: $5-10/month
- **No additional database costs**
- **No API usage fees**
- **No storage fees**
- **No per-user fees**

---

## 🎯 **Perfect for Family Bookkeeping**

### **Family Features:**
- ✅ **Multiple family members** - Share data
- ✅ **Real-time sync** - Live updates
- ✅ **Role-based access** - Parent/child permissions
- ✅ **File sharing** - Receipt images
- ✅ **Admin management** - Family oversight

### **Business Benefits:**
- ✅ **Low cost** - Only VPS cost
- ✅ **Unlimited users** - No per-user fees
- ✅ **Unlimited storage** - Within VPS limits
- ✅ **Unlimited API calls** - No rate limiting
- ✅ **Complete control** - Your own backend

---

## 🚀 **Quick Start (5 Minutes)**

### **1. Download & Run:**
```bash
# On your GoDaddy VPS
wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip
unzip pocketbase_linux_amd64.zip
chmod +x pocketbase
./pocketbase serve --http=0.0.0.0:8090
```

### **2. Access Admin:**
- Open: `http://your-vps-ip:8090/_/`
- Create admin account
- Start creating collections

### **3. Update Flutter App:**
```dart
// Change your API URL to your VPS
static const String backendUrl = 'http://your-vps-ip:8090';
```

**That's it! Your complete backend is ready!** 🎉

---

## ✅ **Summary**

**You can create a complete backend on your GoDaddy VPS without buying any database because:**

1. **✅ SQLite included** - PocketBase comes with SQLite database
2. **✅ No additional costs** - Only your VPS cost
3. **✅ Complete backend** - Database, API, auth, storage, real-time
4. **✅ Easy setup** - 5 minutes to get running
5. **✅ Unlimited usage** - No per-user or API call limits
6. **✅ Full control** - Your own server and data

**Your GoDaddy VPS + PocketBase = Complete backend solution for $0 additional cost!** 🎉✨
