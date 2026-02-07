#!/bin/bash
echo "🚀 Applying Vercel Environment Variables..."

# 1. Clean up old variables (force removal to avoid failures if they don't exist is tricky without error check, 
# but 'env rm' fails if not found. We use '|| true' to ignore errors)
echo "🧹 Cleaning up old variables..."
npx vercel env rm NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY production -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY preview -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY development -y || true

npx vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN development -y || true

npx vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID production -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID preview -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID development -y || true

npx vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET preview -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET development -y || true

npx vercel env rm NEXT_PUBLIC_FIREBASE_DATABASE_URL production -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_DATABASE_URL preview -y || true
npx vercel env rm NEXT_PUBLIC_FIREBASE_DATABASE_URL development -y || true

# 2. Add PRODUCTION variables (Target: Production)
echo "✅ Adding PRODUCTION variables..."
echo "playokeforyou" | npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo "AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc" | npx vercel env add NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY production
echo "playokeforyou.firebaseapp.com" | npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
echo "playokeforyou.firebasestorage.app" | npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo "https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app" | npx vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL production

# 3. Add DEVELOPMENT variables (Target: Preview, Development - HYBRID CONFIG)
echo "🛠 Adding PREVIEW/DEV variables (Hybrid: Prod Auth + Dev DB)..."
# Preview
echo "playokeforyou" | npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID preview
echo "AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc" | npx vercel env add NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY preview
echo "playokeforyou.firebaseapp.com" | npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview
echo "playokeforyou.firebasestorage.app" | npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET preview
# Note: Database URL points to DEV RTDB for isolation
echo "https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app" | npx vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL preview

# Development
echo "playokeforyou" | npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID development
echo "AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc" | npx vercel env add NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY development
echo "playokeforyou.firebaseapp.com" | npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN development
echo "playokeforyou.firebasestorage.app" | npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET development
# Note: Database URL points to DEV RTDB for isolation
echo "https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app" | npx vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL development

echo "🎉 Done! Please redeploy key environments to see changes."
