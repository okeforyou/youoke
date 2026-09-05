#!/usr/bin/env bash
set -e

# ==============================================================================
# Dual-Environment Pull Sync Script (Antigravity ↔ AI Studio)
# Repo: okeforyou/youoke
# Branch: main
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OWNER_NAME="okeforyou"
OWNER_EMAIL="youoke.okeforyou@gmail.com"
REPO_URL="github.com/okeforyou/youoke.git"

# 1. Read .git_token
TOKEN=""
if [ -f ".git_token" ]; then
    TOKEN="$(cat .git_token | tr -d ' \n\r\t')"
elif [ -n "$GITHUB_TOKEN" ]; then
    TOKEN="$GITHUB_TOKEN"
fi

if [ -z "$TOKEN" ]; then
    echo "❌ ERROR: .git_token not found at $ROOT_DIR/.git_token"
    exit 1
fi

# 2. Enforce Author Identity
git config --global user.name "$OWNER_NAME"
git config --global user.email "$OWNER_EMAIL"
git config user.name "$OWNER_NAME"
git config user.email "$OWNER_EMAIL"

# 3. Ensure Git is initialized
if [ ! -d ".git" ]; then
    echo "⚡ Initializing git repo..."
    git init
    git branch -M main
fi

# 4. Set temporary authenticated remote
git remote remove origin 2>/dev/null || true
git remote add origin "https://${TOKEN}@${REPO_URL}"

# Cleanup trap to restore safe remote URL
cleanup() {
    echo "🔒 Clearing remote URL credentials..."
    git remote set-url origin "https://${REPO_URL}" 2>/dev/null || true
}
trap cleanup EXIT

echo "📥 Fetching latest changes from GitHub origin/main..."
git fetch origin main

# Check if there are local uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️ Local unstaged changes detected. Stashing before pull..."
    git stash push -m "ai-studio-auto-stash-$(date +%s)"
    STASHED=1
fi

echo "🔄 Merging origin/main..."
git pull --ff-only origin main || git pull origin main

if [ "$STASHED" = "1" ]; then
    echo "📦 Restoring local stash..."
    git stash pop || echo "⚠️ Stash pop encountered conflict, please inspect stash."
fi

CURRENT_SHA="$(git log -1 --format='%h')"
LAST_MSG="$(git log -1 --format='%s')"
LAST_AUTHOR="$(git log -1 --format='%an <%ae>')"

echo ""
echo "=========================================================="
echo "🎉 Pull Completed Successfully!"
echo "📌 Current Commit: $CURRENT_SHA"
echo "💬 Message:        $LAST_MSG"
echo "👤 Author:         $LAST_AUTHOR"
echo "=========================================================="
