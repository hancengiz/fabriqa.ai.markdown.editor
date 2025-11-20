#!/bin/bash

# release.sh - Helper script for creating releases
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get version type (default to patch)
VERSION_TYPE=${1:-patch}

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major|premajor|preminor|prepatch|prerelease)$ ]]; then
  echo -e "${RED}❌ Invalid version type: $VERSION_TYPE${NC}"
  echo "Usage: ./scripts/release.sh [patch|minor|major]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/release.sh patch   # 0.1.0 → 0.1.1"
  echo "  ./scripts/release.sh minor   # 0.1.0 → 0.2.0"
  echo "  ./scripts/release.sh major   # 0.1.0 → 1.0.0"
  exit 1
fi

echo -e "${BLUE}🚀 Starting release process...${NC}"
echo ""

# Check if working directory is clean
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ Working directory is not clean. Please commit or stash changes first.${NC}"
  git status -s
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📦 Current version: ${GREEN}v$CURRENT_VERSION${NC}"

# Calculate new version
npm version $VERSION_TYPE --no-git-tag-version > /dev/null
NEW_VERSION=$(node -p "require('./package.json').version")

# Revert package.json temporarily to show the version change
git checkout package.json package-lock.json
echo -e "${BLUE}📦 New version will be: ${GREEN}v$NEW_VERSION${NC}"
echo ""

# Confirm with user
read -p "Continue with release v$NEW_VERSION? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}❌ Release cancelled${NC}"
  exit 1
fi

echo -e "${BLUE}🔨 Building extension...${NC}"
npm run build

echo -e "${BLUE}📦 Packaging extension...${NC}"
npx vsce package --no-dependencies

echo -e "${BLUE}✅ Package created: fabriqa.ai-markdown-editor-$NEW_VERSION.vsix${NC}"
echo ""

# Ask if user wants to test locally
read -p "Test installation locally? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}📥 Installing extension locally...${NC}"
  code --install-extension "fabriqa.ai-markdown-editor-$NEW_VERSION.vsix"
  echo -e "${YELLOW}⚠️  Please test the extension in VS Code${NC}"
  read -p "Press enter when testing is complete..."
fi

# Update version properly with npm version (creates tag)
echo -e "${BLUE}🏷️  Creating version tag...${NC}"
npm version $VERSION_TYPE

# Open CHANGELOG.md for editing
echo -e "${YELLOW}📝 Opening CHANGELOG.md for editing...${NC}"
echo -e "${YELLOW}Please document your changes for v$NEW_VERSION${NC}"
read -p "Press enter to open CHANGELOG.md..."
code CHANGELOG.md

read -p "Have you updated CHANGELOG.md? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Please update CHANGELOG.md before continuing${NC}"
  exit 1
fi

# Amend the version commit to include changelog
echo -e "${BLUE}📝 Amending commit with CHANGELOG.md...${NC}"
git add CHANGELOG.md
git commit --amend --no-edit

# Show what will be pushed
echo ""
echo -e "${BLUE}📤 Ready to push:${NC}"
echo -e "  - Commit: $(git log -1 --oneline)"
echo -e "  - Tag: v$NEW_VERSION"
echo ""

# Final confirmation
read -p "Push to GitHub and trigger automated publishing? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}❌ Push cancelled. You can manually push with:${NC}"
  echo -e "${YELLOW}   git push origin master${NC}"
  echo -e "${YELLOW}   git push origin v$NEW_VERSION${NC}"
  exit 1
fi

# Push to GitHub
echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
git push origin master
git push origin "v$NEW_VERSION"

echo ""
echo -e "${GREEN}✅ Release v$NEW_VERSION created successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Next steps:${NC}"
echo -e "  1. Monitor GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*:\(.*\)\.git/\1/')/actions"
echo -e "  2. Check marketplace (in ~10 min): https://marketplace.visualstudio.com/items?itemName=fabriqa.fabriqa.ai-markdown-editor"
echo -e "  3. Verify GitHub release: https://github.com/$(git config --get remote.origin.url | sed 's/.*:\(.*\)\.git/\1/')/releases"
echo ""
echo -e "${GREEN}🎉 Publishing automation is now running!${NC}"
