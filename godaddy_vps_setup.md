# GoDaddy VPS Setup for PocketBase Family Bookkeeping App

## 🚀 **GoDaddy VPS Requirements & Setup**

### **✅ GoDaddy VPS Specifications (Recommended)**

#### **Minimum Requirements:**
- **RAM**: 1GB (2GB recommended)
- **CPU**: 1 core (2 cores recommended)
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or CentOS 8
- **Bandwidth**: 1TB/month (usually unlimited)

#### **Cost**: ~$5-10/month

---

## 🛠️ **Step-by-Step Setup Guide**

### **1. Connect to Your GoDaddy VPS**

```bash
# SSH into your VPS
ssh root@your-vps-ip-address

# Or if you have a username
ssh username@your-vps-ip-address
```

### **2. Update System**

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget unzip git nginx certbot python3-certbot-nginx
```

### **3. Install PocketBase**

```bash
# Create app directory
sudo mkdir -p /opt/pocketbase
cd /opt/pocketbase

# Download PocketBase (Linux version)
sudo wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip

# Extract
sudo unzip pocketbase_linux_amd64.zip

# Make executable
sudo chmod +x pocketbase

# Test run
sudo ./pocketbase serve --http=0.0.0.0:8090
```

### **4. Create Systemd Service**

```bash
# Create service file
sudo nano /etc/systemd/system/pocketbase.service
```

**Add this content:**
```ini
[Unit]
Description=PocketBase Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=0.0.0.0:8090
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### **5. Enable and Start Service**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable pocketbase

# Start service
sudo systemctl start pocketbase

# Check status
sudo systemctl status pocketbase
```

### **6. Configure Nginx (Reverse Proxy)**

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/pocketbase
```

**Add this content:**
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

### **7. Enable Site and Restart Nginx**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pocketbase /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### **8. Setup SSL Certificate (Let's Encrypt)**

```bash
# Install SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 **PocketBase Configuration for Family Bookkeeping**

### **1. Access Admin UI**
- Open browser: `https://your-domain.com/_/`
- Create admin account
- Set up collections

### **2. Create Collections (Database Tables)**

#### **Users Collection (Auth):**
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
      "name": "date",
      "type": "date",
      "required": true
    },
    {
      "name": "user_id",
      "type": "relation",
      "options": {
        "collectionId": "users"
      }
    },
    {
      "name": "family_id",
      "type": "relation",
      "options": {
        "collectionId": "families"
      }
    }
  ]
}
```

---

## 📊 **Performance Optimization**

### **1. Database Optimization**

```bash
# Create backup script
sudo nano /opt/pocketbase/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/pocketbase/backups"
mkdir -p $BACKUP_DIR

# Backup PocketBase data
cp /opt/pocketbase/data.db $BACKUP_DIR/pocketbase_$DATE.db

# Keep only last 7 days of backups
find $BACKUP_DIR -name "pocketbase_*.db" -mtime +7 -delete

echo "Backup completed: pocketbase_$DATE.db"
```

```bash
# Make executable
sudo chmod +x /opt/pocketbase/backup.sh

# Add to crontab (daily backup at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/pocketbase/backup.sh
```

### **2. Nginx Optimization**

```bash
# Edit Nginx config
sudo nano /etc/nginx/nginx.conf
```

**Add these optimizations:**
```nginx
http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Connection limits
    limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
    limit_req_zone $binary_remote_addr zone=req_limit_per_ip:10m rate=10r/s;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### **3. Firewall Configuration**

```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 📱 **Flutter App Configuration**

### **Update your Flutter app to use your VPS:**

```dart
// lib/core/config/app_config.dart
class AppConfig {
  // Your GoDaddy VPS URL
  static const String pocketBaseUrl = 'https://your-domain.com';
  
  // Or use IP directly (less secure)
  // static const String pocketBaseUrl = 'http://your-vps-ip:8090';
  
  static final PocketBase pb = PocketBase(pocketBaseUrl);
}
```

### **Test Connection:**

```dart
// Test connection
Future<void> testConnection() async {
  try {
    final health = await AppConfig.pb.health.check();
    print('✅ PocketBase is running: $health');
  } catch (e) {
    print('❌ Connection failed: $e');
  }
}
```

---

## 💰 **Cost Analysis**

### **GoDaddy VPS Costs:**
- **VPS Hosting**: $5-10/month
- **Domain**: $10-15/year (optional)
- **SSL Certificate**: FREE (Let's Encrypt)
- **Total**: ~$5-10/month

### **vs Other Solutions:**
| Solution | Monthly Cost | Users | Storage |
|----------|-------------|-------|---------|
| **Firebase** | $50-200 | 1K-10K | 1GB-10GB |
| **Supabase** | $25-100 | 500-5K | 500MB-5GB |
| **GoDaddy VPS + PocketBase** | **$5-10** | **Unlimited** | **20GB+** |

---

## 🔒 **Security Best Practices**

### **1. Server Security**

```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Change SSH port (optional)
sudo nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222
sudo systemctl restart ssh
```

### **2. PocketBase Security**

```bash
# Set up regular backups
sudo crontab -e
# Add: 0 2 * * * /opt/pocketbase/backup.sh

# Monitor logs
sudo journalctl -u pocketbase -f
```

---

## 📈 **Scaling for Growth**

### **When to Upgrade VPS:**

#### **Current Setup (1GB RAM):**
- ✅ **Up to 100 families**
- ✅ **Up to 1,000 users**
- ✅ **Up to 10,000 expenses/month**

#### **Upgrade to 2GB RAM:**
- ✅ **Up to 500 families**
- ✅ **Up to 5,000 users**
- ✅ **Up to 50,000 expenses/month**

#### **Upgrade to 4GB RAM:**
- ✅ **Up to 2,000 families**
- ✅ **Up to 20,000 users**
- ✅ **Up to 200,000 expenses/month**

---

## 🎯 **Perfect for Your Family Bookkeeping App**

### **Why GoDaddy VPS + PocketBase is Ideal:**

#### **✅ Cost-Effective:**
- Only $5-10/month total cost
- No per-user fees
- No API call limits
- Unlimited storage (within VPS limits)

#### **✅ Family-Focused:**
- Real-time sync for family members
- Role-based permissions
- File storage for receipts
- Admin UI for family management

#### **✅ Scalable:**
- Start small, grow as needed
- Easy to upgrade VPS
- Can handle thousands of users
- Professional setup

#### **✅ Reliable:**
- 99.9% uptime with proper setup
- Automatic backups
- SSL encryption
- Professional monitoring

**Your GoDaddy VPS is perfect for PocketBase! You'll save hundreds of dollars compared to Firebase while getting better performance and control.** 🎉✨
