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

# 4. Add SERVICE ACCOUNT variables (Used for Admin SDK)
# WARNING: This includes sensitive keys. Ensure this script is not public or keys are injected via CI/CD if possible.
# For local convenience, we add them here based on User provided JSON.

echo "🔑 Adding SERVICE ACCOUNT variables..."

# Production Keys (Also used for Dev/Preview in Hybrid Mode)
CLIENT_EMAIL="firebase-adminsdk-6dzxn@playokeforyou.iam.gserviceaccount.com"
# Private Key needs special handling for newlines
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfYDr47USIiUTD\nE9Fb46kMmYL5pVizqWe+zv543r0VJbFrnas/VTYgiH4zl4iTJtf+cObPx+2J8kaj\nrg7b6sX9hFzLgiFmbClMoDxZGcNrhx6I5l090EIPMtRq2K9TmBtbeuBvQm1GyuhM\ngwff8b2H4NAgArkuO5BSefsAnPoF4Gmb0DNoVq//fd4JTbsF6e4XFKs8nJ4TsQoD\naVGltMsqnrwJkhJjQFDMV2SXLyHQN6WA/WenIsaTv230+wfYDmRXi7CdK7PLZdII\nxzttpwU3u0HZ1ULRjG+OM1HRBfNJ/OMvumYUfxAvlOxJ2xOGsWZyDUUbXyViY4Eb\nulZOQA71AgMBAAECggEABNDkQPd0zPf8IcsKhZ3/JUPrlCYZoXYvCcYM8f5q2ogG\nw2TryD8TRxua/Awu5qgFlI2iGcXe7A1Z+KzEx0pcAUzhm5FfP3pRMbkUPAIwE8NB\n3HtudFiEX13VTIv6qP+S7uC8Q8qNgdHu43RSwynxxGjoul7cqS+tQRsPkU9LS7Fq\n9cDwJtrvJftvo1yDD2+gqqaA7xCCLtyxlur6++2RTaGn9RBgtKUoDmtVw4iivooU\npzl4QJE1PnBe7PpvnuBorZ9H5jlPZt12gJ3U5JVhdeKsZeXIumP+pJ7BmHQ+HJAW\nsy2je7Z8ZaOeWXq3h8A5FvdTebGhRPLUT7brrPKRkQKBgQD4/6u/Of+I4VN18haJ\nrN4X8WTCVqLqjzEaVUQnyPa4UVZ/+B3JG4RFIBYK8y5IHivZdeQrztbhwH0IUoSD\n2qY1T/1vcOEa1rVa0lrjxvwsB4/pfQ2OsZCn5kvsjf724EJg+iOf3ElqHxSWE0ZI\nQ07ZdspyeuKTB9UKDJn7ipvAEQKBgQDlqB9qGfE/d+yFVpJgXEtCSey+2UEFEzp1\nkRxym//HVfCXHplTRyRSeZUO4y67kEWMswtk9RLpHjixA/MDFkjkTOirtGRcDnyC\nFdhs8DaIVa17e0eXocTzedhoyRdQIskwoHrp5bahpfMT7gHsSegh3OqqaxYC3PyQ\n2CE+SA0EpQKBgQDmDSIbDXTgfH5l7IOSM9sGeArF2tGusRmG4NyVfYEljlDC7vRm\nCDxOuXRkLYXHL8kHo3pqVzIFZZifhc3VHMCPZRYcTkhMSa9I+CztYb0+2MXHzbgm\n7DtgRNBFAHRel5f8jV84pYhWudyFQ82dmkJRfQVSe+K2QXg9TqM92jRIYQKBgC1i\nHushu0n2kff7lquSMZEk+LLyTeYJ2biX944yg8ZJlmTWuCf73BKsUieB/58zMHtQ\neoT15UnKHhvlEuXeRoNPK3+bA2YpurMeTAmjIrOocsL/JrOxVTFkN77lVkUQyr9g\nR0nnikLBf5rFov2l0Ui31mvdA5mHQCYDf/ZF2MS9AoGBAIVszLrYFhklbG+YlNeq\nuljAm4Gey9aplXEsDhwZDT41NN4WaQLZqZ0v/U2wPg7ZLMwgW4vBNeYsoRQCYBf0\n5nJQu2P49e4sNpSdRjrsjh3boBkgJlyurMtVLILkcSpC/akB0JN6F7QJo6aVal++\n/WGQrsIRwqK4qH0In5A0Oqny\n-----END PRIVATE KEY-----\n"

# Remove old keys first
npx vercel env rm FIREBASE_CLIENT_EMAIL production -y || true
npx vercel env rm FIREBASE_CLIENT_EMAIL preview -y || true
npx vercel env rm FIREBASE_CLIENT_EMAIL development -y || true
npx vercel env rm FIREBASE_PRIVATE_KEY production -y || true
npx vercel env rm FIREBASE_PRIVATE_KEY preview -y || true
npx vercel env rm FIREBASE_PRIVATE_KEY development -y || true

# Add New Keys to ALL Environments (Hybrid Mode)
echo "$CLIENT_EMAIL" | npx vercel env add FIREBASE_CLIENT_EMAIL production
echo "$CLIENT_EMAIL" | npx vercel env add FIREBASE_CLIENT_EMAIL preview
echo "$CLIENT_EMAIL" | npx vercel env add FIREBASE_CLIENT_EMAIL development

echo "$PRIVATE_KEY" | npx vercel env add FIREBASE_PRIVATE_KEY production
echo "$PRIVATE_KEY" | npx vercel env add FIREBASE_PRIVATE_KEY preview
echo "$PRIVATE_KEY" | npx vercel env add FIREBASE_PRIVATE_KEY development

echo "🎉 Done! Please redeploy key environments to see changes."
