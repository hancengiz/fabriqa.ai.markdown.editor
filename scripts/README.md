# Helper Scripts

## release.sh

Automated release script that handles the entire release process.

### Usage

```bash
./scripts/release.sh [patch|minor|major]
```

### Examples

```bash
# Bug fix release (0.1.0 → 0.1.1)
./scripts/release.sh patch

# New feature release (0.1.0 → 0.2.0)
./scripts/release.sh minor

# Breaking change release (0.1.0 → 1.0.0)
./scripts/release.sh major
```

### What it does

1. ✅ Validates working directory is clean
2. ✅ Shows current and new version
3. ✅ Asks for confirmation
4. ✅ Builds the extension
5. ✅ Packages the extension
6. ✅ Optionally tests installation locally
7. ✅ Creates version tag
8. ✅ Opens CHANGELOG.md for editing
9. ✅ Amends commit with changelog changes
10. ✅ Pushes to GitHub (triggers automated publishing)

### Prerequisites

- Git working directory must be clean
- No uncommitted changes
- Node.js and npm installed
- VS Code CLI (`code` command) available

### Interactive Prompts

The script will ask you to:
- Confirm the new version
- Test the extension locally (optional)
- Update CHANGELOG.md
- Confirm before pushing to GitHub

### After Running

Monitor these:
- **GitHub Actions**: Check workflow status
- **Marketplace**: Extension appears in ~10 minutes
- **GitHub Releases**: Release created automatically

### Troubleshooting

**"Working directory is not clean"**
```bash
git status
git add .
git commit -m "your message"
```

**"Invalid version type"**
Use one of: `patch`, `minor`, `major`

**Script fails to push**
```bash
# Manually push:
git push origin master
git push origin --tags
```

### Manual Alternative

If you prefer not to use the script:

```bash
# 1. Update version
npm version patch

# 2. Edit CHANGELOG.md
code CHANGELOG.md

# 3. Amend commit
git add CHANGELOG.md
git commit --amend --no-edit

# 4. Push
git push origin master --tags
```
