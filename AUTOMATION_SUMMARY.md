# 🤖 Automated Publishing Setup Complete!

Your VS Code extension now has fully automated publishing via GitHub Actions!

## 📦 What's Been Set Up

### 1. **GitHub Actions Workflows** (`.github/workflows/`)

Two automated workflows have been created:

#### **CI Workflow** (`ci.yml`)
- Runs on every push and pull request
- Tests on Node.js 18.x and 20.x
- Builds and packages the extension
- Uploads artifacts for testing
- **Purpose**: Catch issues before release

#### **Publish Workflow** (`publish.yml`)
- Triggers on git tags (e.g., `v0.1.0`)
- Also runs manually from GitHub UI
- Builds and publishes to VS Code Marketplace
- Creates GitHub releases automatically
- Attaches VSIX file to releases
- **Purpose**: Automated deployment

### 2. **Helper Scripts** (`scripts/`)

#### **release.sh** - Interactive Release Script
```bash
./scripts/release.sh patch   # For bug fixes
./scripts/release.sh minor   # For new features
./scripts/release.sh major   # For breaking changes
```

**Features:**
- ✅ Validates clean working directory
- ✅ Shows version changes
- ✅ Builds and packages extension
- ✅ Optionally tests locally
- ✅ Opens CHANGELOG.md for editing
- ✅ Creates git tag
- ✅ Pushes to GitHub (triggers publishing)

### 3. **Documentation**

- **`.github/SETUP_AUTOMATION.md`** - Step-by-step setup guide (~25 min)
- **`.github/workflows/README.md`** - Detailed workflow documentation
- **`scripts/README.md`** - Helper script documentation
- **`PUBLISHING.md`** - Complete publishing guide

## 🚀 Quick Start (First Time Setup)

### Step 1: Create Personal Access Token (5 min)

**Option A: Try direct from marketplace first:**
1. Go to https://marketplace.visualstudio.com/manage
2. Create publisher (if needed)
3. Look for "Generate Token" or "Personal Access Token" option

**Option B: Via Azure DevOps (if needed):**
1. Go to https://dev.azure.com
2. Create organization (if needed - it's free)
3. User Settings (top right) → Personal Access Tokens
4. New Token → Select "All accessible organizations"
5. Show all scopes → Check **Marketplace** → **Manage**
6. Copy the token

### Step 2: Add Token to GitHub (2 min)

1. Go to your GitHub repo → Settings → Secrets → Actions
2. Add new secret:
   - Name: `VSCE_PAT`
   - Value: Your token from Step 1

### Step 3: Create Publisher (3 min)

1. Go to https://marketplace.visualstudio.com/manage/createpublisher
2. Create publisher ID: `fabriqa`
3. Verify `package.json` has `"publisher": "fabriqa"`

### Step 4: Fix Icon (2 min)

Convert SVG to PNG:
```bash
# Using ImageMagick:
brew install imagemagick
convert resources/icon.svg -resize 128x128 resources/icon.png
```

Update `package.json`:
```json
{
  "icon": "resources/icon.png"
}
```

### Step 5: Push Workflows to GitHub

```bash
git add .github/ scripts/
git commit -m "ci: add automated publishing workflows"
git push origin master
```

**🎉 Setup Complete!**

## 📝 Daily Workflow (After Setup)

### Option A: Using Helper Script (Recommended)

```bash
# Make changes to your code
git add .
git commit -m "feat: add new feature"

# Create release (interactive)
./scripts/release.sh patch
```

The script will:
1. Build and package
2. Let you test locally
3. Open CHANGELOG.md
4. Create tag and push
5. Trigger automated publishing

### Option B: Manual Git Tags

```bash
# Make changes
git add .
git commit -m "feat: add new feature"

# Update version
npm version patch  # or minor/major

# Update CHANGELOG.md
code CHANGELOG.md
git add CHANGELOG.md
git commit --amend --no-edit

# Push (triggers automation)
git push origin master --tags
```

### Option C: Manual from GitHub UI

1. Go to Actions → "Publish to VS Code Marketplace"
2. Click "Run workflow"
3. Enter version type
4. Click "Run workflow"

## 🔍 Monitoring Releases

### GitHub Actions
- URL: `https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor/actions`
- Check workflow status
- View build logs
- Download artifacts

### VS Code Marketplace
- URL: `https://marketplace.visualstudio.com/items?itemName=fabriqa.fabriqa.ai.markdown.editor`
- Check installation count
- View ratings and reviews
- Updates appear in ~10 minutes

### GitHub Releases
- URL: `https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor/releases`
- Automatically created on publish
- Includes VSIX download

## 📊 Version Management

Follow [Semantic Versioning](https://semver.org):

| Type | Example | Use Case |
|------|---------|----------|
| **PATCH** | 0.1.0 → 0.1.1 | Bug fixes |
| **MINOR** | 0.1.0 → 0.2.0 | New features (backward compatible) |
| **MAJOR** | 0.1.0 → 1.0.0 | Breaking changes |

```bash
# Bug fix
./scripts/release.sh patch

# New feature
./scripts/release.sh minor

# Breaking change
./scripts/release.sh major
```

## 🎯 Release Checklist

Before each release:

- [ ] All changes committed and pushed
- [ ] Tests passing locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Extension tested manually
- [ ] CHANGELOG.md updated
- [ ] Version number appropriate for changes
- [ ] No breaking changes (unless major version)

After release:

- [ ] GitHub Actions workflow completed successfully
- [ ] Extension appears on marketplace
- [ ] Can install from marketplace
- [ ] GitHub release created
- [ ] VSIX file attached to release

## 🔧 Troubleshooting

### "VSCE_PAT secret not found"
**Fix:** Add `VSCE_PAT` secret to GitHub repository settings

### "Publisher not found"
**Fix:**
1. Create publisher at https://marketplace.visualstudio.com/manage
2. Update `package.json` with correct publisher ID

### "Icon must be PNG"
**Fix:**
1. Convert SVG to PNG (see Step 4 above)
2. Update `package.json` icon path

### Workflow fails but no clear error
**Fix:**
1. Check workflow logs in GitHub Actions
2. Try building locally: `npm run build`
3. Try packaging locally: `npx vsce package`
4. Check all required fields in `package.json`

### Extension doesn't appear on marketplace
**Wait:** Publication can take 10-15 minutes
**Check:** Workflow completed successfully
**Verify:** No errors in GitHub Actions logs

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `.github/SETUP_AUTOMATION.md` | Initial setup guide (step-by-step) |
| `.github/workflows/README.md` | Workflow documentation (technical details) |
| `scripts/README.md` | Helper script usage |
| `PUBLISHING.md` | Complete publishing guide |
| `AUTOMATION_SUMMARY.md` | This file (quick reference) |

## 🎓 Learning Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI](https://github.com/microsoft/vscode-vsce)
- [Semantic Versioning](https://semver.org)
- [Keep a Changelog](https://keepachangelog.com)

## 🚀 Advanced Features (Optional)

See `.github/workflows/README.md` for:
- Publishing to Open VSX Registry (for VSCodium users)
- Slack notifications on release
- Environment protection rules
- Approval workflows
- Pre-release versions

## ✅ You're All Set!

Your extension now has:
- ✅ Automated CI/CD pipeline
- ✅ Automated marketplace publishing
- ✅ Automated GitHub releases
- ✅ Helper scripts for easy releases
- ✅ Comprehensive documentation

**Next release:**
```bash
./scripts/release.sh patch
```

Happy publishing! 🎉
