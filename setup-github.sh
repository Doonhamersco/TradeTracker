#!/bin/bash

# GitHub Setup Script for Trade Tracker
# Run this script to prepare your repository for GitHub

echo "🚀 Setting up Git repository for GitHub deployment..."
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first:"
    echo "   macOS: brew install git"
    echo "   Or download from: https://git-scm.com/downloads"
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📝 Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Creating initial commit..."
    git commit -m "Initial commit: Trade Tracker app ready for deployment"
    echo "✅ Files committed"
fi

# Rename branch to main
echo "🌿 Setting branch to 'main'..."
git branch -M main 2>/dev/null || echo "Branch already named 'main'"

echo ""
echo "✅ Git repository is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Create a repository on GitHub: https://github.com/new"
echo "2. Copy the repository URL (e.g., https://github.com/YOUR_USERNAME/trade-tracker.git)"
echo "3. Run these commands (replace YOUR_USERNAME and trade-tracker with your values):"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/trade-tracker.git"
echo "   git push -u origin main"
echo ""
echo "📖 For detailed instructions, see: GITHUB_DEPLOYMENT_GUIDE.md"

