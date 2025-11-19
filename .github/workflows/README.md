# GitHub Actions Workflows

This directory contains automated workflows for CI/CD and publishing to the VS Code Marketplace.

## Workflows

### 1. CI (`ci.yml`)
**Triggers:** Push to master/main/develop, Pull Requests

**What it does:**
- Runs on multiple Node.js versions (18.x, 20.x)
- Installs dependencies
- Lints code (if configured)
- Builds the extension
- Runs tests (if configured)
- Packages the extension
- Uploads VSIX as artifact for testing

### 2. Publish (`publish.yml`)
**Triggers:**
- Git tags matching `v*.*.*` (e.g., v0.1.0, v1.2.3)
- Manual workflow dispatch from GitHub UI

**What it does:**
- Builds and packages the extension
- Publishes to VS Code Marketplace
- Creates GitHub Release with VSIX attachment
- Uploads VSIX as artifact

## Setup Instructions

### 1. Create Personal Access Token (PAT)

There are two methods to get a token:

#### Method A: Direct from VS Code Marketplace (Recommended)

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account
3. Click on your publisher name or create a new publisher
4. You'll see a "Personal Access Token" section or a link to generate one
5. If prompted to create a token via Azure DevOps, it will redirect you automatically

#### Method B: Via Azure DevOps (if needed)

1. Go to [Azure DevOps](https://dev.azure.com)
2. Sign in with your Microsoft account
3. If you don't have an organization, create one (it's free)
4. Click on **User Settings** icon (gear icon or profile) in the top right
5. Select **Personal Access Tokens**
6. Click **+ New Token**
7. Configure:
   - **Name**: `GitHub Actions VS Code Publisher`
   - **Organization**: Select **All accessible organizations**
   - **Expiration**: Custom defined (90 days to 1 year)
   - **Scopes**: Click **Show all scopes**, scroll down and select:
     - ✅ **Marketplace** → **Manage** (check the box)
8. Click **Create**
9. **IMPORTANT**: Copy the token immediately - you won't see it again!

### 2. Add PAT to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VSCE_PAT`
5. Value: Paste your Personal Access Token
6. Click **Add secret**

### 3. Verify Publisher in package.json

Ensure `package.json` has the correct publisher:
```json
{
  "publisher": "fabriqa",
  "name": "fabriqa.ai.markdown.editor",
  "version": "0.1.0"
}
```

## Usage

### Method 1: Automated Publishing with Git Tags (Recommended)

This is the most common workflow for releasing new versions.

```bash
# 1. Update version and changelog
npm version patch   # 0.1.0 → 0.1.1
# or
npm version minor   # 0.1.0 → 0.2.0
# or
npm version major   # 0.1.0 → 1.0.0

# This automatically:
# - Updates package.json version
# - Creates a git commit
# - Creates a git tag

# 2. Update CHANGELOG.md with changes
# Edit CHANGELOG.md to document your changes

# 3. Amend the version commit to include changelog
git add CHANGELOG.md
git commit --amend --no-edit

# 4. Push to GitHub (this triggers the workflow)
git push origin master
git push origin --tags

# GitHub Actions will automatically:
# - Build the extension
# - Run tests
# - Publish to VS Code Marketplace
# - Create a GitHub Release
```

### Method 2: Manual Publishing from GitHub UI

Use this for hotfixes or when you need more control.

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Publish to VS Code Marketplace** workflow
4. Click **Run workflow** dropdown
5. Enter version (e.g., `patch`, `minor`, `major`, or `1.2.3`)
6. Click **Run workflow**

### Method 3: Local Publishing (Fallback)

If GitHub Actions fails, you can publish manually:

```bash
# Login to vsce
npx vsce login fabriqa

# Publish
npx vsce publish
```

## Release Checklist

Before creating a new release:

- [ ] Update version number (`npm version patch/minor/major`)
- [ ] Update CHANGELOG.md with all changes
- [ ] Test the extension locally
- [ ] Build succeeds: `npm run build`
- [ ] Commit all changes
- [ ] Push code and tags to GitHub
- [ ] Verify GitHub Actions workflow succeeds
- [ ] Check extension on [VS Code Marketplace](https://marketplace.visualstudio.com)
- [ ] Test installation: `code --install-extension fabriqa.fabriqa.ai.markdown.editor`

## Versioning Strategy

Follow [Semantic Versioning](https://semver.org):

- **MAJOR** (1.0.0): Breaking changes
  ```bash
  npm version major
  ```

- **MINOR** (0.2.0): New features (backward compatible)
  ```bash
  npm version minor
  ```

- **PATCH** (0.1.1): Bug fixes
  ```bash
  npm version patch
  ```

- **Prerelease** (0.1.1-beta.0): Testing versions
  ```bash
  npm version prerelease --preid=beta
  ```

## Troubleshooting

### "VSCE_PAT secret not found"
- Ensure you've added the `VSCE_PAT` secret to GitHub repository settings
- Check that the secret name is exactly `VSCE_PAT` (case-sensitive)

### "Publisher not found"
- Verify the `publisher` field in `package.json` matches your Azure DevOps publisher ID
- Ensure you've created a publisher account at https://marketplace.visualstudio.com/manage

### "Extension validation failed"
- Check that all required fields in `package.json` are filled
- Ensure `icon` field points to a PNG file (not SVG)
- Verify `README.md` exists and has content

### "Build failed"
- Check the build logs in GitHub Actions
- Try building locally: `npm run build`
- Ensure all dependencies are in `package.json`

### "Tests failed"
- Tests are currently set to `continue-on-error: true`
- Fix tests locally before publishing
- Run tests: `npm test`

## Monitoring Releases

### View Workflow Status
1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. View logs for each step

### View Published Versions
- Marketplace: https://marketplace.visualstudio.com/items?itemName=fabriqa.fabriqa.ai.markdown.editor
- GitHub Releases: https://github.com/YOUR_USERNAME/fabriqa.ai.markdown.editor/releases

### Check Extension Stats
- Install count, ratings, and reviews on marketplace page
- Download statistics in Azure DevOps publisher portal

## Best Practices

1. **Always test locally before tagging**
   ```bash
   npm run build
   npx vsce package
   code --install-extension fabriqa.ai.markdown.editor-0.1.0.vsix
   ```

2. **Keep CHANGELOG.md updated**
   - Document all changes before releasing
   - Follow [Keep a Changelog](https://keepachangelog.com) format

3. **Use meaningful commit messages**
   ```bash
   git commit -m "feat: add checkbox support"
   git commit -m "fix: resolve click handling issue"
   git commit -m "docs: update README with examples"
   ```

4. **Tag releases consistently**
   - Use `v` prefix: `v0.1.0`, `v1.0.0`
   - Match package.json version

5. **Monitor workflow runs**
   - Check GitHub Actions after pushing tags
   - Fix issues immediately if workflow fails

6. **Secure your PAT**
   - Never commit PAT to repository
   - Set reasonable expiration (90 days to 1 year)
   - Rotate token before expiration

## Advanced Configuration

### Publish Only on Approved PRs

Add approval step to `publish.yml`:

```yaml
jobs:
  publish:
    environment:
      name: production
      url: https://marketplace.visualstudio.com/items?itemName=fabriqa.fabriqa.ai.markdown.editor
```

Then configure environment protection rules in GitHub repository settings.

### Publish to Open VSX Registry (Optional)

Add this step to `publish.yml` for VSCodium users:

```yaml
- name: Publish to Open VSX Registry
  run: npx ovsx publish -p ${{ secrets.OVSX_PAT }}
  continue-on-error: true
```

### Slack Notifications

Add notification step:

```yaml
- name: Notify Slack
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "✅ Extension v${{ steps.package-version.outputs.version }} published!"
      }
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [vsce CLI Documentation](https://github.com/microsoft/vscode-vsce)
- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Azure DevOps PAT Guide](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
