#!/bin/bash

# ========================================
# Simple One-Command Deployment to Plesk
# ========================================

echo "🚀 Starting deployment to play.okeforyou.com..."
echo ""
echo "This will:"
echo "  1. Clone repository from GitHub"
echo "  2. Install dependencies"
echo "  3. Build Next.js app"
echo "  4. Start with PM2"
echo ""
echo "⏱️  This may take 5-10 minutes..."
echo ""

# Run all commands in one SSH session
ssh -t okefor@139.99.114.128 << 'ENDSSH'
cd play.okeforyou.com

echo "🗑️  Cleaning old files..."
rm -rf * .[^.] .??* 2>/dev/null

echo "📥 Cloning repository..."
git clone -b main https://github.com/okeforyou/youoke.git .

echo "📦 Installing dependencies..."
npm install --production --legacy-peer-deps

echo "🔨 Building Next.js..."
npm run build

echo "🚀 Setting up PM2..."
npm install -g pm2 2>/dev/null
pm2 delete youoke-prod 2>/dev/null || true
pm2 start npm --name "youoke-prod" -- start
pm2 save
pm2 startup

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 Recent logs:"
pm2 logs youoke-prod --lines 20 --nostream

echo ""
echo "🎉 Done! Visit https://play.okeforyou.com"
ENDSSH

echo ""
echo "✅ Deployment script finished!"
