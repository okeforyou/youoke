#!/usr/bin/env bash
set -e

# ==============================================================================
# Persistent Git Multi-Account Push Protocol Script (Rule 9)
# Repo: okeforyou/youoke
# Author: okeforyou <youoke.okeforyou@gmail.com>
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OWNER_NAME="okeforyou"
OWNER_EMAIL="youoke.okeforyou@gmail.com"
REPO_URL="github.com/okeforyou/youoke.git"

# 1. Check for .git_token
TOKEN=""
if [ -f ".git_token" ]; then
    TOKEN="$(cat .git_token | tr -d ' \n\r\t')"
elif [ -n "$GITHUB_TOKEN" ]; then
    TOKEN="$GITHUB_TOKEN"
fi

if [ -z "$TOKEN" ]; then
    echo "❌ ERROR: .git_token file not found or empty at $ROOT_DIR/.git_token"
    exit 1
fi

# 2. Enforce Author Identity (Prevent Vercel Deploy Block)
git config --global user.name "$OWNER_NAME"
git config --global user.email "$OWNER_EMAIL"
git config user.name "$OWNER_NAME"
git config user.email "$OWNER_EMAIL"

echo "✅ Git Author configured: $(git config user.name) <$(git config user.email)>"

# 3. Ensure Git repository & branches are ready
if [ ! -d ".git" ]; then
    echo "⚡ Initializing git repository..."
    git init
    git branch -M main
fi

# Set temporary remote with token
git remote remove origin 2>/dev/null || true
git remote add origin "https://${TOKEN}@${REPO_URL}"

# 4. Cleanup trap to always restore safe remote URL (No Token Leak)
cleanup() {
    echo "🔒 Clearing remote URL credentials for safety..."
    git remote set-url origin "https://${REPO_URL}" 2>/dev/null || true
}
trap cleanup EXIT

COMMIT_MSG="${1:-chore: update code and sync}"

# 5. Rule 8 Automation: Detect changes in plugin/bridge and auto-bump if not bumped
CHANGED_PLUGIN_FILES=$(git status --porcelain | grep -E "scripts/local-bridge|youoke-plugin" || true)
if [ -n "$CHANGED_PLUGIN_FILES" ]; then
    VERSION_DIFF=$(git diff | grep -E '^\+[ ]*"version":' || true)
    if [ -z "$VERSION_DIFF" ]; then
        CURRENT_VER=$(node -e "console.log(require('./youoke-plugin/package.json').version)")
        NEXT_VER=$(node -e "const p = require('./youoke-plugin/package.json').version.split('.'); p[2] = parseInt(p[2])+1; console.log(p.join('.'))")
        echo "⚡ Rule 8 Automation: Detected changes in plugin/local-bridge without version bump."
        echo "⚡ Automatically bumping plugin version: $CURRENT_VER -> $NEXT_VER"
        node scripts/bump-version.js "$NEXT_VER"
        COMMIT_MSG="release(plugin): bump to v${NEXT_VER} — ${COMMIT_MSG}"
    fi
fi

# 6. Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📦 Staging changes and committing..."
    git add -A
    git commit -m "$COMMIT_MSG"
fi

# 7. Ensure latest commit has correct author (Rule 9)
LAST_AUTHOR_EMAIL="$(git log -1 --format='%ae')"
if [ "$LAST_AUTHOR_EMAIL" != "$OWNER_EMAIL" ]; then
    echo "⚠️ Correcting last commit author to $OWNER_EMAIL..."
    git commit --amend --reset-author --no-edit
fi

CURRENT_SHA="$(git log -1 --format='%h')"
echo "🚀 Pushing commit $CURRENT_SHA to main..."
git push origin main

echo "🎉 Successfully pushed to main under author: $OWNER_NAME!"
