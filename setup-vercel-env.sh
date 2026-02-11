#!/bin/bash

# Vercel Environment Variables Setup Script
# Purpose: Set production Firebase config for all Vercel environments

echo "🚀 Setting up Vercel Environment Variables..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
echo "🔐 Please login to Vercel (if not already logged in)..."
vercel login

# Link project
echo "🔗 Linking to Vercel project..."
vercel link --yes

echo ""
echo "📝 Setting environment variables..."
echo ""

# Set NEXT_PUBLIC_FIREBASE_PROJECT_ID
echo "1/5: Setting NEXT_PUBLIC_FIREBASE_PROJECT_ID..."
echo "playokeforyou" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production preview

# Set NEXT_PUBLIC_FIREBASE_DATABASE_URL
echo "2/5: Setting NEXT_PUBLIC_FIREBASE_DATABASE_URL..."
echo "https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app" | vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL production preview

# Set NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY
echo "3/5: Setting NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY..."
echo "AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc" | vercel env add NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY production preview

# Set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
echo "4/5: Setting NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN..."
echo "playokeforyou.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production preview

# Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
echo "5/5: Setting NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET..."
echo "playokeforyou.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production preview

echo ""
echo "✅ All environment variables set!"
echo ""
echo "🔄 Triggering redeploy..."

# Commit empty to trigger rebuild
git commit --allow-empty -m "chore: Trigger Vercel rebuild with production Firebase config"
git push origin refactor/admin-standardization

echo ""
echo "🎉 Done! Vercel will redeploy automatically."
echo "   Wait 2-3 minutes then test:"
echo "   https://youoke-git-refactor-admin-standardization-okeforyous-projects.vercel.app"
echo ""
