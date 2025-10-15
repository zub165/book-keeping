#!/bin/bash

# Setup GitHub Repository for Family Bookkeeping Frontend

echo "🚀 Setting up GitHub deployment for Family Bookkeeping Frontend..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Family Bookkeeping Frontend with Django Backend Integration"

echo ""
echo "✅ Git repository ready!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Copy the repository URL"
echo "3. Run these commands:"
echo "   git remote add origin https://github.com/yourusername/your-repo.git"
echo "   git push -u origin main"
echo ""
echo "4. Update public/js/config.js with your GoDaddy domain"
echo "5. Enable GitHub Pages in repository settings"
echo ""
echo "🌐 Your app will be available at: https://yourusername.github.io/your-repo"
