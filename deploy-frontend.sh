#!/bin/bash

# Frontend Deployment Script for GitHub Pages

echo "🚀 Deploying Family Bookkeeping Frontend to GitHub Pages..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please initialize git first."
    exit 1
fi

# Check if we have a remote origin
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/your-repo.git"
    exit 1
fi

# Add all changes
echo "📝 Adding changes..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy frontend to GitHub Pages - $(date)"

# Push to main branch
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Frontend deployment initiated!"
echo "🌐 Your app will be available at: https://yourusername.github.io/your-repo"
echo ""
echo "📝 Don't forget to:"
echo "   1. Update the API_BASE_URL in public/js/config.js with your Django backend URL"
echo "   2. Enable GitHub Pages in your repository settings"
echo "   3. Configure CORS on your Django backend to allow your GitHub Pages domain"
