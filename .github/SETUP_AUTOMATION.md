# Quick Setup: Automated Publishing

Follow these steps to set up automated publishing to VS Code Marketplace via GitHub Actions.

## Prerequisites

- ✅ GitHub repository set up
- ✅ Extension working locally
- ✅ Microsoft/Azure DevOps account

---

## Step 1: Create Personal Access Token (5 min)

### Option A: Try Marketplace First (Easiest)

1. **Go to VS Code Marketplace Publisher Management**
   - Visit: https://marketplace.visualstudio.com/manage
   - Sign in with your Microsoft account (create one if needed)

2. **Create Publisher** (if you don't have one)
   - Click **Create publisher** or **New publisher**
   - Publisher ID: `fabriqa` (lowercase, no spaces)
   - Display Name: `fabriqa.ai`
   - Email: Your email

3. **Look for Token Option**
   - Some publishers have a direct "Generate Token" or "Personal Access Token" option
   - If available, use this and skip to Step 2
   - If not available, continue to Option B below

### Option B: Via Azure DevOps (If needed)

1. **Go to Azure DevOps**
   - Visit: https://dev.azure.com
   - Sign in with your Microsoft account

2. **Create Organization** (if you don't have one)
   - Click "New organization" or "Create organization"
   - Follow the prompts (it's free)

3. **Create Personal Access Token**
   - Click **User Settings** icon (gear/profile) in top right corner
   - Select **Personal Access Tokens**
   - Click **+ New Token**

4. **Configure Token**
   - **Name**: `GitHub Actions Publisher`
   - **Organization**: Select **All accessible organizations**
   - **Expiration**: Custom defined (90 days to 1 year)
   - **Scopes**: Click **Show all scopes**, scroll down and find:
     - ✅ **Marketplace** → **Manage** (check this box)

5. **Create and Copy Token**
   - Click **Create**
   - **IMPORTANT**: Copy the token immediately - you won't see it again!
   - Save it temporarily in a secure note

---

## Step 2: Create VS Code Marketplace Publisher (3 min)

1. **Go to Marketplace Management**
   - Visit: https://marketplace.visualstudio.com/manage/createpublisher
   - Sign in with the same Microsoft account

2. **Create Publisher**
   - **Publisher ID**: `fabriqa` (use lowercase, no spaces)
   - **Publisher Display Name**: `fabriqa.ai`
   - **Email**: Your email address

3. **Verify package.json**
   - Ensure your `package.json` has the matching publisher:
   ```json
   {
     "publisher": "fabriqa",
     "name": "fabriqa.ai.markdown.editor"
   }
   ```

---

## Step 3: Add Secret to GitHub Repository (2 min)

1. **Go to Your GitHub Repository**
   - Navigate to: `https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor`

2. **Open Settings**
   - Click **Settings** tab
   - Click **Secrets and variables** → **Actions** (left sidebar)

3. **Add Repository Secret**
   - Click **New repository secret**
   - **Name**: `VSCE_PAT` (exactly this, case-sensitive)
   - **Secret**: Paste the Personal Access Token from Step 1
   - Click **Add secret**

---

## Step 4: Fix Icon Format (2 min)

The marketplace requires PNG format (not SVG).

**Option A: Use ImageMagick** (if installed)
```bash
brew install imagemagick
convert resources/icon.svg -resize 128x128 resources/icon.png
```

**Option B: Use Online Converter**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `resources/icon.svg`
3. Download the PNG
4. Save as `resources/icon.png`

**Option C: Use icon.png already in root**
```bash
# If there's already an icon.png in the root directory:
mv icon.png resources/icon.png
```

**Update package.json:**
```json
{
  "icon": "resources/icon.png"
}
```

---

## Step 5: Update package.json Metadata (3 min)

Add these fields to `package.json`:

```json
{
  "publisher": "fabriqa",
  "name": "fabriqa.ai.markdown.editor",
  "displayName": "fabriqa.ai Markdown Editor",
  "version": "0.1.0",
  "icon": "resources/icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor#readme",
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
    "Formatters"
  ],
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  }
}
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 6: Create .vscodeignore (2 min)

Create `.vscodeignore` in the root directory to exclude unnecessary files:

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
*.sh
temp_logs.sh
test-workspace/**
.obsidian/**
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
.github/**
```

---

## Step 7: Test Locally Before Publishing (5 min)

```bash
# 1. Install vsce globally (if not installed)
npm install -g @vscode/vsce

# 2. Build the extension
npm run build

# 3. Package the extension
npx vsce package

# This creates: fabriqa.ai.markdown.editor-0.1.0.vsix

# 4. Test installation
code --install-extension fabriqa.ai.markdown.editor-0.1.0.vsix

# 5. Open a markdown file and test all features
```

If everything works, proceed to Step 8.

---

## Step 8: Commit and Push GitHub Actions Workflows (3 min)

```bash
# 1. Add the workflow files
git add .github/

# 2. Commit
git commit -m "ci: add GitHub Actions for automated publishing"

# 3. Push to GitHub
git push origin master
```

---

## Step 9: Create Your First Release! (2 min)

### Method A: Automated (Recommended)

```bash
# 1. Update version and create tag
npm version patch  # Creates v0.1.1 tag

# 2. Update CHANGELOG.md with your changes
# Edit CHANGELOG.md to add your release notes

# 3. Amend the version commit to include changelog
git add CHANGELOG.md
git commit --amend --no-edit

# 4. Push to GitHub (triggers the workflow!)
git push origin master
git push origin --tags
```

### Method B: Manual via GitHub UI

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Publish to VS Code Marketplace**
4. Click **Run workflow**
5. Enter `patch` (or `minor`, `major`)
6. Click **Run workflow**

---

## Step 10: Verify Publication (5 min)

1. **Check GitHub Actions**
   - Go to **Actions** tab in GitHub
   - Watch the workflow run
   - Ensure all steps complete successfully (green checkmarks)

2. **Check VS Code Marketplace**
   - Wait 5-10 minutes for marketplace to update
   - Visit: `https://marketplace.visualstudio.com/items?itemName=fabriqa.fabriqa.ai.markdown.editor`
   - Verify your extension appears

3. **Test Installation from Marketplace**
   ```bash
   # Uninstall local version first
   code --uninstall-extension fabriqa.fabriqa.ai.markdown.editor

   # Install from marketplace
   code --install-extension fabriqa.fabriqa.ai.markdown.editor
   ```

4. **Check GitHub Release**
   - Go to `https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor/releases`
   - Verify your release appears with the VSIX attachment

---

## 🎉 You're Done!

Your extension is now published and automated!

### Future Releases

Just run:
```bash
npm version patch   # or minor, or major
# Update CHANGELOG.md
git add CHANGELOG.md
git commit --amend --no-edit
git push origin master --tags
```

GitHub Actions handles the rest automatically! 🚀

---

## Quick Reference: Publishing Commands

```bash
# For bug fixes (0.1.0 → 0.1.1)
npm version patch && git push origin master --tags

# For new features (0.1.0 → 0.2.0)
npm version minor && git push origin master --tags

# For breaking changes (0.1.0 → 1.0.0)
npm version major && git push origin master --tags
```

---

## Troubleshooting

### Workflow Fails: "VSCE_PAT not found"
- Go to GitHub → Settings → Secrets → Actions
- Verify `VSCE_PAT` secret exists and is spelled correctly

### Workflow Fails: "Publisher 'fabriqa' not found"
- Verify publisher exists: https://marketplace.visualstudio.com/manage
- Check `package.json` publisher field matches your publisher ID

### Icon Error: "Icon must be PNG"
- Convert SVG to PNG (see Step 4)
- Update `package.json` icon field to point to PNG

### Extension Not Appearing on Marketplace
- Wait 10-15 minutes after publishing
- Check workflow logs for errors
- Verify publication at: https://marketplace.visualstudio.com/manage

### Need Help?
- Check `.github/workflows/README.md` for detailed documentation
- View workflow logs in GitHub Actions tab
- Contact support at: https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor/issues

---

## Next Steps

- Add screenshots to README.md for better marketplace visibility
- Set up Open VSX publishing for VSCodium users
- Configure Slack notifications for releases
- Add automated testing before publishing
- Create a CONTRIBUTING.md guide

See `.github/workflows/README.md` for advanced configuration options.
