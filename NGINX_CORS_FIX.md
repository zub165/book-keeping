# 🔧 NGINX CORS FIX - Duplicate Headers Issue

## 🚨 **Problem Identified:**
The Nginx server is sending **duplicate CORS headers**, causing browsers to block requests:
- `Access-Control-Allow-Origin` appears twice
- `Access-Control-Allow-Credentials` appears twice
- Browser rejects requests with "multiple values" error

## ✅ **Solution:**
Update the Nginx configuration to send **single CORS headers only**.

---

## 🛠️ **Step-by-Step Fix:**

### **Step 1: Access Your GoDaddy Server**
```bash
# SSH into your GoDaddy server
ssh your-username@208.109.215.53
```

### **Step 2: Backup Current Nginx Config**
```bash
# Backup the current configuration
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
# OR if using a different config file:
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

### **Step 3: Edit Nginx Configuration**
```bash
# Edit the Nginx configuration file
sudo nano /etc/nginx/sites-available/default
# OR
sudo nano /etc/nginx/nginx.conf
```

### **Step 4: Replace the Family API Location Block**
Find the existing `/family-api/` location block and replace it with:

```nginx
# Family Bookkeeping API (Port 3017) - FIXED VERSION
location /family-api/ {
    # Remove trailing slash to avoid double slashes
    proxy_pass http://localhost:3017/api;
    
    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers - SINGLE VALUES ONLY (no duplicates)
    add_header 'Access-Control-Allow-Origin' 'https://zub165.github.io' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    
    # Handle preflight OPTIONS requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://zub165.github.io' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
```

### **Step 5: Test Nginx Configuration**
```bash
# Test the configuration for syntax errors
sudo nginx -t
```

### **Step 6: Reload Nginx**
```bash
# If test passes, reload Nginx
sudo systemctl reload nginx
# OR
sudo service nginx reload
```

### **Step 7: Verify the Fix**
```bash
# Test the CORS headers
curl -I https://api.mywaitime.com/family-api/auth/login/ -H "Origin: https://zub165.github.io"
```

**Expected Result:** You should see **single CORS headers** (no duplicates).

---

## 🔍 **Alternative Fix (If Above Doesn't Work):**

If you're still getting duplicate headers, use this override approach:

```nginx
location /family-api/ {
    proxy_pass http://localhost:3017/api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Override any existing CORS headers with single values
    more_set_headers 'Access-Control-Allow-Origin: https://zub165.github.io';
    more_set_headers 'Access-Control-Allow-Credentials: true';
    more_set_headers 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS';
    more_set_headers 'Access-Control-Allow-Headers: DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
    
    if ($request_method = 'OPTIONS') {
        more_set_headers 'Access-Control-Allow-Origin: https://zub165.github.io';
        more_set_headers 'Access-Control-Allow-Credentials: true';
        more_set_headers 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS';
        more_set_headers 'Access-Control-Allow-Headers: DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        more_set_headers 'Access-Control-Max-Age: 1728000';
        more_set_headers 'Content-Type: text/plain; charset=utf-8';
        more_set_headers 'Content-Length: 0';
        return 204;
    }
}
```

---

## ✅ **After the Fix:**

1. **Test Login**: https://zub165.github.io/book-keeping/
2. **Use Demo Credentials**:
   - Email: `demo@example.com`
   - Password: `demo12345`

## 🎯 **Expected Result:**
- ✅ No more CORS errors in browser console
- ✅ Login/registration works perfectly
- ✅ All API calls succeed
- ✅ Family Bookkeeping app fully functional

---

## 🆘 **If You Need Help:**
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify Django is running: `curl http://localhost:3017/api/`
- Test CORS headers: `curl -I https://api.mywaitime.com/family-api/auth/login/`

**The fix should resolve the duplicate CORS headers and make the login work!** 🚀
