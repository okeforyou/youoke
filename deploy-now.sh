#!/bin/bash

# ========================================
# Quick Deploy Script - Run from Local Mac
# ========================================

echo "🚀 Starting deployment to play.okeforyou.com..."

# SSH connection details
SSH_HOST="139.99.114.128"
SSH_USER="okefor"
SSH_PASS='$0rHSuQujx8fzu?w'
REMOTE_PATH="/var/www/vhosts/play.okeforyou.com/httpdocs"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "📦 Installing sshpass..."
    if command -v brew &> /dev/null; then
        brew install hudochenkov/sshpass/sshpass
    else
        echo "❌ Please install Homebrew first: https://brew.sh"
        exit 1
    fi
fi

echo "🔐 Connecting to server..."

# Run deployment commands via SSH
sshpass -p "${SSH_PASS}" ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} << 'ENDSSH'

echo "📁 Moving to directory..."
cd /var/www/vhosts/play.okeforyou.com/httpdocs

echo "📥 Downloading deployment script..."
curl -sO https://raw.githubusercontent.com/okeforyou/youoke/main/deploy-to-plesk.sh

echo "🔧 Making script executable..."
chmod +x deploy-to-plesk.sh

echo "🚀 Running deployment..."
./deploy-to-plesk.sh

ENDSSH

echo ""
echo "✅ Deployment completed!"
echo "🌐 Check your website at: https://play.okeforyou.com"
