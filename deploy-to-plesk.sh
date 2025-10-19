#!/bin/bash

# ========================================
# YouOke Deployment Script for Plesk
# ========================================

echo "🚀 Starting deployment to play.okeforyou.com..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_PATH="/var/www/vhosts/play.okeforyou.com/httpdocs"
REPO_URL="https://github.com/okeforyou/youoke.git"
BRANCH="main"

echo -e "${BLUE}📁 Working directory: ${DOMAIN_PATH}${NC}"

# Step 1: Navigate to domain directory
cd ${DOMAIN_PATH} || { echo -e "${RED}❌ Cannot access directory${NC}"; exit 1; }

# Step 2: Clone or pull from GitHub
if [ -d ".git" ]; then
    echo -e "${BLUE}📥 Pulling latest changes from GitHub...${NC}"
    git fetch origin
    git reset --hard origin/${BRANCH}
    git pull origin ${BRANCH}
else
    echo -e "${BLUE}📥 Cloning repository from GitHub...${NC}"
    git clone -b ${BRANCH} ${REPO_URL} .
fi

echo -e "${GREEN}✅ Code updated from GitHub${NC}"

# Step 3: Install dependencies (production only)
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --production --legacy-peer-deps

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 4: Build the project
echo -e "${BLUE}🔨 Building Next.js project...${NC}"
npm run build

echo -e "${GREEN}✅ Build completed${NC}"

# Step 5: Setup PM2 (if not exists)
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}📦 Installing PM2...${NC}"
    npm install -g pm2
fi

# Step 6: Start/Restart application with PM2
echo -e "${BLUE}🔄 Starting application...${NC}"

# Stop existing process if any
pm2 delete youoke-prod 2>/dev/null || true

# Start new process
pm2 start npm --name "youoke-prod" -- start

# Save PM2 config
pm2 save

# Setup auto-startup
pm2 startup systemd -u okefor --hp /var/www/vhosts/play.okeforyou.com

echo -e "${GREEN}✅ Application started with PM2${NC}"

# Step 7: Show status
echo -e "${BLUE}📊 Application status:${NC}"
pm2 status

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📍 Your website is now live at:${NC}"
echo -e "${GREEN}   https://play.okeforyou.com${NC}"
echo ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo -e "   pm2 status          - Check application status"
echo -e "   pm2 logs youoke-prod - View application logs"
echo -e "   pm2 restart youoke-prod - Restart application"
echo -e "   pm2 stop youoke-prod - Stop application"
echo ""
