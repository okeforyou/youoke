#!/bin/bash

# Update Vercel Environment Variables to use Firebase Dev
# This script updates all Firebase-related env vars on Vercel

echo "🔥 Updating Vercel Environment Variables to Firebase Dev..."
echo ""

# Firebase Dev Config
API_KEY="AIzaSyBBIhI9VCi3OEgP5mxWotuAJYqJ46MG2gw"
AUTH_DOMAIN="playokeforyou-dev.firebaseapp.com"
PROJECT_ID="playokeforyou-dev"
STORAGE_BUCKET="playokeforyou-dev.firebasestorage.app"
DATABASE_URL="https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app"

# Function to update env var for all environments
update_env() {
  local name=$1
  local value=$2

  echo "📝 Updating $name..."

  # Add to Production
  echo "$value" | vercel env add "$name" production --force 2>/dev/null || \
    echo "$value" | vercel env add "$name" production 2>/dev/null

  # Add to Preview
  echo "$value" | vercel env add "$name" preview --force 2>/dev/null || \
    echo "$value" | vercel env add "$name" preview 2>/dev/null

  # Add to Development
  echo "$value" | vercel env add "$name" development --force 2>/dev/null || \
    echo "$value" | vercel env add "$name" development 2>/dev/null

  echo "✅ Updated $name"
  echo ""
}

# Update all Firebase env vars
update_env "NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY" "$API_KEY"
update_env "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "$AUTH_DOMAIN"
update_env "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "$PROJECT_ID"
update_env "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "$STORAGE_BUCKET"
update_env "NEXT_PUBLIC_FIREBASE_DATABASE_URL" "$DATABASE_URL"

echo ""
echo "🎉 Done! All environment variables updated."
echo ""
echo "📌 Next step: Redeploy your app"
echo "   Run: git push origin main"
echo ""
