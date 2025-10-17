# PocketBase Setup for Family Bookkeeping App

## 🚀 **What is PocketBase?**

PocketBase is a **single-file backend** written in Go that provides:
- **SQLite database** (built-in)
- **REST API** (auto-generated)
- **Real-time subscriptions** (WebSocket)
- **Authentication** (built-in)
- **File storage** (built-in)
- **Admin UI** (web-based)
- **Row Level Security** (RLS)

## 💰 **Why PocketBase is Perfect for Your App:**

### **Cost Benefits:**
- ✅ **COMPLETELY FREE** - No usage limits
- ✅ **Self-hosted** - Your own server
- ✅ **No vendor lock-in** - Open source
- ✅ **Unlimited users** - No per-user fees
- ✅ **Unlimited storage** - Only limited by your server
- ✅ **Unlimited API calls** - No rate limiting

### **Technical Benefits:**
- ✅ **Single binary** - Easy to deploy
- ✅ **SQLite database** - Fast and reliable
- ✅ **Real-time updates** - Live data sync
- ✅ **Built-in auth** - User management
- ✅ **Admin UI** - Manage data visually
- ✅ **REST API** - Standard HTTP endpoints

---

## 🛠️ **PocketBase Installation & Setup**

### **1. Download PocketBase**
```bash
# Download the latest release
wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip

# Extract
unzip pocketbase_linux_amd64.zip

# Make executable
chmod +x pocketbase

# Run PocketBase
./pocketbase serve
```

### **2. Access Admin UI**
- Open browser: `http://localhost:8090/_/`
- Create admin account
- Set up collections (tables)

### **3. Create Collections (Database Tables)**

#### **Users Collection:**
```json
{
  "name": "users",
  "type": "auth",
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "name": "phone",
      "type": "text"
    },
    {
      "name": "avatar",
      "type": "file",
      "options": {
        "maxSelect": 1,
        "maxSize": 5242880
      }
    },
    {
      "name": "subscription_plan",
      "type": "select",
      "options": {
        "values": ["free", "premium", "family"]
      }
    }
  ]
}
```

#### **Families Collection:**
```json
{
  "name": "families",
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "name": "owner_id",
      "type": "relation",
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "plan",
      "type": "select",
      "options": {
        "values": ["free", "premium", "family"]
      }
    },
    {
      "name": "is_active",
      "type": "bool",
      "default": true
    }
  ]
}
```

#### **Family Members Collection:**
```json
{
  "name": "family_members",
  "schema": [
    {
      "name": "family_id",
      "type": "relation",
      "options": {
        "collectionId": "families",
        "cascadeDelete": true
      }
    },
    {
      "name": "user_id",
      "type": "relation",
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "role",
      "type": "select",
      "options": {
        "values": ["owner", "admin", "member", "viewer", "child"]
      }
    },
    {
      "name": "spending_limit",
      "type": "number"
    },
    {
      "name": "joined_at",
      "type": "date"
    },
    {
      "name": "is_active",
      "type": "bool",
      "default": true
    }
  ]
}
```

#### **Expenses Collection:**
```json
{
  "name": "expenses",
  "schema": [
    {
      "name": "description",
      "type": "text",
      "required": true
    },
    {
      "name": "amount",
      "type": "number",
      "required": true
    },
    {
      "name": "category",
      "type": "text",
      "required": true
    },
    {
      "name": "subcategory",
      "type": "text"
    },
    {
      "name": "date",
      "type": "date",
      "required": true
    },
    {
      "name": "user_id",
      "type": "relation",
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "family_id",
      "type": "relation",
      "options": {
        "collectionId": "families",
        "cascadeDelete": true
      }
    },
    {
      "name": "receipt",
      "type": "file",
      "options": {
        "maxSelect": 1,
        "maxSize": 10485760
      }
    },
    {
      "name": "notes",
      "type": "text"
    },
    {
      "name": "is_tax_deductible",
      "type": "bool",
      "default": false
    }
  ]
}
```

#### **Miles Collection:**
```json
{
  "name": "miles",
  "schema": [
    {
      "name": "description",
      "type": "text",
      "required": true
    },
    {
      "name": "miles",
      "type": "number",
      "required": true
    },
    {
      "name": "rate",
      "type": "number",
      "required": true
    },
    {
      "name": "date",
      "type": "date",
      "required": true
    },
    {
      "name": "user_id",
      "type": "relation",
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "family_id",
      "type": "relation",
      "options": {
        "collectionId": "families",
        "cascadeDelete": true
      }
    }
  ]
}
```

#### **Hours Collection:**
```json
{
  "name": "hours",
  "schema": [
    {
      "name": "description",
      "type": "text",
      "required": true
    },
    {
      "name": "hours",
      "type": "number",
      "required": true
    },
    {
      "name": "rate",
      "type": "number",
      "required": true
    },
    {
      "name": "date",
      "type": "date",
      "required": true
    },
    {
      "name": "user_id",
      "type": "relation",
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "family_id",
      "type": "relation",
      "options": {
        "collectionId": "families",
        "cascadeDelete": true
      }
    }
  ]
}
```

---

## 🔒 **Row Level Security (RLS) Rules**

### **Users can only see their own data:**
```javascript
// Users collection
@request.auth.id != "" && @request.auth.id = id
```

### **Family members can see family data:**
```javascript
// Families collection
@request.auth.id != "" && (
  owner_id = @request.auth.id || 
  user_id = @request.auth.id
)
```

### **Expenses are visible to family members:**
```javascript
// Expenses collection
@request.auth.id != "" && (
  user_id = @request.auth.id || 
  family_id.family_members.user_id = @request.auth.id
)
```

---

## 📱 **Flutter Integration**

### **1. Add PocketBase to pubspec.yaml:**
```yaml
dependencies:
  pocketbase: ^0.1.0
```

### **2. Initialize PocketBase:**
```dart
import 'package:pocketbase/pocketbase.dart';

class AppConfig {
  static const String pocketBaseUrl = 'https://your-pocketbase.com';
  static final PocketBase pb = PocketBase(pocketBaseUrl);
}
```

### **3. Authentication:**
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

### **4. CRUD Operations:**
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

### **5. Real-time Subscriptions:**
```dart
// Subscribe to expense changes
AppConfig.pb.collection('expenses').subscribe('*', (e) {
  print('Expense updated: ${e.record.data}');
  // Update UI
});
```

---

## 🚀 **Deployment Options**

### **1. Self-Hosted (Recommended)**
```bash
# VPS/Cloud Server
# Ubuntu 20.04 LTS
# 1GB RAM, 1 CPU, 25GB SSD
# Cost: ~$5/month

# Install PocketBase
wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip
unzip pocketbase_linux_amd64.zip
chmod +x pocketbase

# Run as service
sudo nano /etc/systemd/system/pocketbase.service
```

### **2. Docker Deployment:**
```dockerfile
FROM alpine:latest
RUN apk add --no-cache ca-certificates
COPY pocketbase /pocketbase
EXPOSE 8090
CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090"]
```

### **3. Cloud Platforms:**
- **Railway** - $5/month
- **Fly.io** - $5/month  
- **DigitalOcean** - $5/month
- **AWS EC2** - $5/month

---

## 📊 **Cost Comparison**

| Solution | Monthly Cost | Users | Storage | API Calls |
|----------|-------------|-------|---------|-----------|
| **Firebase** | $50-200 | 1K-10K | 1GB-10GB | 100K-1M |
| **Supabase** | $25-100 | 500-5K | 500MB-5GB | 50K-500K |
| **PocketBase** | **$5** | **Unlimited** | **Unlimited** | **Unlimited** |

---

## 🎯 **Benefits for Family Bookkeeping App**

### **Perfect for Your Use Case:**
- ✅ **Family sharing** - Multiple users per family
- ✅ **Real-time sync** - Live updates for all family members
- ✅ **File storage** - Receipt images
- ✅ **Admin UI** - Easy data management
- ✅ **Cost-effective** - Only $5/month for unlimited usage
- ✅ **Self-hosted** - Complete control over data
- ✅ **Open source** - No vendor lock-in

### **Scalability:**
- **Small families** (2-6 members) - Perfect fit
- **Large families** (10+ members) - Still works great
- **Multiple families** - One PocketBase instance can handle many families
- **Enterprise** - Can handle thousands of users

**PocketBase is the perfect solution for your Family Bookkeeping app - it's free, powerful, and scales with your needs!** 🎉✨
