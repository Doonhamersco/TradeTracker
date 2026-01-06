#!/bin/bash

# Script to push to GitHub with proper authentication

echo "🚀 Pushing code to GitHub..."
echo ""
echo "Repository: Doonhamersco/TradeTracker"
echo ""
echo "When prompted:"
echo "  Username: Doonhamersco"
echo "  Password: Paste your NEW Personal Access Token (not your GitHub password)"
echo ""
echo "Press Enter to continue..."
read

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "Next steps:"
    echo "1. Go to Vercel: https://vercel.com"
    echo "2. Import your GitHub repository"
    echo "3. See DEPLOYMENT_STEPS.md for details"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "1. Token doesn't have 'repo' scope - recreate token with 'repo' checked"
    echo "2. Token expired - create a new token"
    echo "3. Wrong username - make sure it's 'Doonhamersco'"
    echo ""
    echo "See FIX_GITHUB_AUTH.md for troubleshooting"
fi

