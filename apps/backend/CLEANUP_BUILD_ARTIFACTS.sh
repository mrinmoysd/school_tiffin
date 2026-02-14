#!/bin/bash

# ============================================
# Clean Build Artifacts from src/ folder
# ============================================

set -e

echo "🧹 Cleaning build artifacts from src/ folder..."
echo ""

cd "$(dirname "$0")"

# Count files before deletion
COUNT=$(find src -type f \( -name "*.d.ts" -o -name "*.d.ts.map" -o -name "*.js" -o -name "*.js.map" \) | wc -l | tr -d ' ')

echo "Found $COUNT build artifact files to remove..."

# Remove all build artifacts from src/
find src -type f \( -name "*.d.ts" -o -name "*.d.ts.map" -o -name "*.js" -o -name "*.js.map" \) -delete

echo ""
echo "✅ Build artifacts cleaned!"
echo ""
echo "📋 Verification:"
find src -type f \( -name "*.d.ts" -o -name "*.js" \) | wc -l | xargs -I {} echo "  Remaining .d.ts/.js files in src/: {}"
echo ""
echo "Note: These files will be regenerated in dist/ when you run 'pnpm build'"
echo ""
