#!/bin/bash

# 🚀 GODADDY BACKEND DEPLOYMENT SCRIPT
# This script helps deploy the updated Django backend to your GoDaddy server

echo "🚀 Starting GoDaddy Backend Deployment..."

# Configuration
SERVER_IP="208.109.215.53"
SERVER_USER="your-username"  # Replace with your actual username
DJANGO_PROJECT_PATH="/path/to/your/django/project"  # Replace with actual path
LOCAL_BACKEND_PATH="./backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 DEPLOYMENT CHECKLIST:${NC}"
echo "1. ✅ Updated Django models with email fields"
echo "2. ✅ Enhanced serializers for new fields"
echo "3. ✅ Added JWT refresh token endpoint"
echo "4. ✅ Database migration files created"
echo ""

# Function to upload files
upload_files() {
    echo -e "${YELLOW}📤 Uploading updated files...${NC}"
    
    # Upload core files
    scp $LOCAL_BACKEND_PATH/api/models.py $SERVER_USER@$SERVER_IP:$DJANGO_PROJECT_PATH/api/
    scp $LOCAL_BACKEND_PATH/api/serializers.py $SERVER_USER@$SERVER_IP:$DJANGO_PROJECT_PATH/api/
    scp $LOCAL_BACKEND_PATH/api/views.py $SERVER_USER@$SERVER_IP:$DJANGO_PROJECT_PATH/api/
    scp $LOCAL_BACKEND_PATH/api/urls.py $SERVER_USER@$SERVER_IP:$DJANGO_PROJECT_PATH/api/
    
    # Upload migration files
    scp -r $LOCAL_BACKEND_PATH/api/migrations/ $SERVER_USER@$SERVER_IP:$DJANGO_PROJECT_PATH/api/
    
    echo -e "${GREEN}✅ Files uploaded successfully!${NC}"
}

# Function to run server commands
run_server_commands() {
    echo -e "${YELLOW}🔧 Running server commands...${NC}"
    
    # SSH into server and run commands
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Navigate to Django project
        cd /path/to/your/django/project  # Replace with actual path
        
        # Backup database
        echo "📦 Backing up database..."
        cp db.sqlite3 db.sqlite3.backup.$(date +%Y%m%d_%H%M%S)
        
        # Apply migrations
        echo "🔄 Applying database migrations..."
        python3 manage.py migrate
        
        # Check Django configuration
        echo "🔍 Checking Django configuration..."
        python3 manage.py check
        
        # Restart PM2 application
        echo "🔄 Restarting Django application..."
        pm2 restart django-app
        
        # Check PM2 status
        echo "📊 PM2 Status:"
        pm2 status
        
        echo "✅ Server commands completed!"
EOF
}

# Function to test deployment
test_deployment() {
    echo -e "${YELLOW}🧪 Testing deployment...${NC}"
    
    # Test API endpoints
    echo "Testing family members endpoint..."
    curl -s -o /dev/null -w "%{http_code}" https://api.mywaitime.com/family-api/family-members/
    
    echo "Testing refresh token endpoint..."
    curl -s -o /dev/null -w "%{http_code}" -X POST https://api.mywaitime.com/family-api/auth/refresh/ \
        -H "Content-Type: application/json" \
        -d '{"refresh":"test"}'
    
    echo -e "${GREEN}✅ Deployment test completed!${NC}"
}

# Main deployment process
main() {
    echo -e "${GREEN}🎯 Starting GoDaddy Backend Deployment${NC}"
    echo ""
    
    # Check if required files exist
    if [ ! -f "$LOCAL_BACKEND_PATH/api/models.py" ]; then
        echo -e "${RED}❌ Error: models.py not found at $LOCAL_BACKEND_PATH/api/${NC}"
        exit 1
    fi
    
    # Upload files
    upload_files
    
    # Run server commands
    run_server_commands
    
    # Test deployment
    test_deployment
    
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED!${NC}"
    echo ""
    echo "✅ What was deployed:"
    echo "   - Email field for family members"
    echo "   - Registration status tracking"
    echo "   - JWT token refresh endpoint"
    echo "   - Database migrations applied"
    echo ""
    echo "🌐 Test your app at: https://zub165.github.io/book-keeping/"
    echo "📧 Try adding 'Muhammad Abdullah' with his email!"
}

# Run main function
main
