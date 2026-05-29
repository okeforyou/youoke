#!/usr/bin/env bash

# AI Coding Protocol - CLI Wrapper
# This script forwards commands to the ai-protocol.js Node.js script.
set -euo pipefail

# Ensure Node.js is installed
if ! command -v node &> /dev/null
then
    echo -e "\x1b[31m❌ Error: Node.js is not installed. Please install Node.js to use the AI Protocol CLI.\x1b[0m"
    exit 1
fi

# Run the JS script
node "$(dirname "$0")/ai-protocol.js" "$@"
