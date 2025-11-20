# Publishing to VS Code Marketplace

This guide walks you through publishing the fabriqa.ai Markdown Editor extension to the Visual Studio Code Marketplace.

## Prerequisites

### 1. Create a Microsoft/Azure DevOps Account

1. Go to [Azure DevOps](https://dev.azure.com)
2. Sign in with your Microsoft account (or create one)
3. Create a new organization if you don't have one

### 2. Create a Personal Access Token (PAT)

1. In Azure DevOps, click on your profile icon (top right)
2. Go to **Security** → **Personal Access Tokens**
3. Click **+ New Token**
4. Configure:
   - **Name**: VS Code Publisher Token
   - **Organization**: Select your organization
   - **Expiration**: Custom defined (e.g., 90 days or 1 year)
   - **Scopes**: Click "Show all scopes" and select:
     - ✅ **Marketplace** → **Acquire** (Read)
     - ✅ **Marketplace** → **Publish** (Manage)
5. Click **Create**
6. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

### 3. Create a Publisher Account

```bash
# Install vsce (Visual Studio Code Extensions) CLI
npm install -g @vscode/vsce

# Login with your Personal Access Token
vsce login <publisher-name>
# When prompted, paste your PAT
```

Or create a publisher via the web:
1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with the same Microsoft account
3. Click **Create publisher**
4. Fill in:
   - **Publisher ID**: `fabriqa` (or your preferred unique ID)
   - **Publisher name**: `fabriqa.ai`
   - **Email**: Your email address

## Pre-Publishing Checklist

### 1. Fix Icon Format

The marketplace requires PNG format (not SVG). Convert your icon:

```bash
# Option 1: Use ImageMagick (install via brew on Mac)
brew install imagemagick
convert resources/icon.svg -resize 128x128 resources/icon.png

# Option 2: Use online converter
# Go to https://cloudconvert.com/svg-to-png and convert
```

Then update `package.json`:
```json
{
  "icon": "resources/icon.png"
}
```

### 2. Update package.json Metadata

Add the following fields to `package.json`:

```json
{
  "publisher": "fabriqa",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/fabriqa.ai-markdown-editor"
  },
  "bugs": {
    "url": "https://github.com/yourusername/fabriqa.ai-markdown-editor/issues"
  },
  "homepage": "https://github.com/yourusername/fabriqa.ai-markdown-editor#readme",
  "license": "MIT",
  "keywords": [
    "markdown",
    "editor",
    "preview",
    "obsidian",
    "live preview",
    "reading mode",
    "markdown editor",
    "checkbox",
    "task list"
  ],
  "categories": [
    "Programming Languages",
    "Formatters",
    "Other"
  ],
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  }
}
```

### 3. Create/Update Documentation

Ensure these files are complete:

- ✅ `README.md` - Main documentation (will be shown on marketplace page)
- ✅ `CHANGELOG.md` - Version history
- ✅ `LICENSE` - Software license

Add screenshots to `README.md` for better visibility on marketplace:
```markdown
![Live Preview Mode](screenshots/live-preview.png)
![Reading Mode](screenshots/reading-mode.png)
![Source Mode](screenshots/source-mode.png)
```

### 4. Add a .vscodeignore File

Create `.vscodeignore` to exclude unnecessary files from the package:

```
.vscode/**
.vscode-test/**
node_modules/**
src/**
.gitignore
.gitattributes
**/*.map
**/.eslintrc.json
**/*.ts
**/tsconfig.json
test/**
.github/**
screenshots/**
*.md
!README.md
!CHANGELOG.md
esbuild.js
temp_logs.sh
test-workspace/**
.obsidian/**
*.sh
CHECK_WEBVIEW_CONSOLE.md
CONSOLE_CHECK.md
FIXED.md
FIX_LAUNCH.md
HOW_TO_TEST.md
OPEN_WEBVIEW_DEVTOOLS.md
SIMPLE_TEST.md
START.md
WHY_NOT_LOADING.md
WHY_NO_SIDEBAR.md
PUBLISHING.md
DEVELOPMENT.md
CONTRIBUTING.md
```

## Publishing Steps

### Option 1: Publish via CLI (Recommended)

```bash
# 1. Make sure all changes are committed
git status

# 2. Build the extension
npm run build

# 3. Login to vsce (if not already logged in)
vsce login fabriqa

# 4. Package the extension (creates .vsix file)
vsce package

# This will create: fabriqa.ai-markdown-editor-0.1.0.vsix

# 5. Test the packaged extension locally
code --install-extension fabriqa.ai-markdown-editor-0.1.0.vsix

# 6. If everything works, publish!
vsce publish

# Or publish a specific version:
# vsce publish minor  # 0.1.0 -> 0.2.0
# vsce publish patch  # 0.1.0 -> 0.1.1
# vsce publish major  # 0.1.0 -> 1.0.0
```

### Option 2: Publish via Web UI

```bash
# 1. Package the extension
vsce package

# 2. Go to https://marketplace.visualstudio.com/manage
# 3. Sign in with your Microsoft account
# 4. Click on your publisher (fabriqa)
# 5. Click "New extension" → "Visual Studio Code"
# 6. Drag and drop the .vsix file
# 7. Click "Upload"
```

## After Publishing

### 1. Verify Publication

1. Go to `https://marketplace.visualstudio.com/items?itemName=fabriqa.fabriqa.ai-markdown-editor`
2. Check that all information displays correctly
3. Test installation: `code --install-extension fabriqa.fabriqa.ai-markdown-editor`

### 2. Share Your Extension

- Add the marketplace badge to README:
```markdown
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/fabriqa.fabriqa.ai-markdown-editor?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=fabriqa.fabriqa.ai-markdown-editor)
```

## Updating Your Extension

When you release new versions:

```bash
# 1. Update version in package.json or use:
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0

# 2. Update CHANGELOG.md with new changes

# 3. Commit changes
git add .
git commit -m "chore: bump version to 0.1.1"
git push

# 4. Create git tag
git tag v0.1.1
git push --tags

# 5. Publish to marketplace
vsce publish
```

## Troubleshooting

### "Publisher not found"
- Make sure you created a publisher account
- Verify the publisher name in package.json matches your publisher ID

### "Icon must be a PNG"
- Convert SVG to PNG (at least 128x128px)
- Update package.json to reference the PNG file

### "Extension activation failed"
- Test locally first: `code --install-extension fabriqa.ai-markdown-editor-0.1.0.vsix`
- Check the extension host logs in VS Code: Developer: Show Logs → Extension Host

### "Files too large"
- Check .vscodeignore is properly excluding source files and node_modules
- Verify with: `vsce ls` to see what files will be included

## Best Practices

1. **Semantic Versioning**: Follow [semver.org](https://semver.org)
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes

2. **Changelog**: Always update CHANGELOG.md before publishing

3. **Testing**: Test the packaged .vsix locally before publishing

4. **Screenshots**: Add high-quality screenshots to README

5. **Keywords**: Use relevant keywords for discoverability

6. **License**: Include a clear license file

7. **Documentation**: Keep README.md comprehensive and up-to-date

## Resources

- [VS Code Publishing Extensions Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [VS Code Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)
- [vsce CLI Documentation](https://github.com/microsoft/vscode-vsce)
