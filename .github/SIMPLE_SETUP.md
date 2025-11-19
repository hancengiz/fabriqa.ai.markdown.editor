# Simplest Setup Guide (Updated)

The Azure DevOps interface has changed. Here's the simplest way to set up automated publishing:

## Method 1: Use vsce CLI to Get Token (Easiest!)

This is the simplest method - let `vsce` handle the authentication:

```bash
# 1. Install vsce globally
npm install -g @vscode/vsce

# 2. Create a publisher interactively (if you don't have one)
npx vsce create-publisher fabriqa

# 3. Login - this will guide you through token creation
npx vsce login fabriqa
```

When you run `vsce login`, it will:
- Open your browser to create a token
- Guide you through the Azure DevOps token creation
- Automatically configure the token

**After logging in successfully:**
```bash
# Get your token from the vsce config
cat ~/.vsce
```

This file contains your token. Copy it for the next step.

---

## Method 2: Manual Azure DevOps (If Method 1 doesn't work)

### Find the Right Page

1. **Start at VS Code Marketplace**
   - Go to: https://marketplace.visualstudio.com/manage/createpublisher
   - Sign in with Microsoft account
   - Create publisher: `fabriqa`

2. **Go to Azure DevOps**
   - If not automatically redirected, go to: https://dev.azure.com
   - Sign in with the SAME Microsoft account

3. **Create Organization (if needed)**
   - You'll see "Create new organization" if you don't have one
   - Name it anything (e.g., "fabriqa-publisher")
   - Click "Continue"

4. **Create Personal Access Token**
   - Look for the **User Settings** icon in the TOP RIGHT corner
   - It might look like: ⚙️ (gear) or your avatar/initials
   - Click it and select **"Personal Access Tokens"**
   - OR try this direct link: https://dev.azure.com/[YOUR-ORG]/_usersSettings/tokens

5. **Create New Token**
   - Click **"+ New Token"** button
   - Fill in:
     ```
     Name: VS Code Publisher Token
     Organization: All accessible organizations
     Expiration: 90 days (or longer)
     ```

6. **Set Scopes**
   - Click **"Show all scopes"** at the bottom
   - Scroll down to find **"Marketplace"**
   - Check the box for **"Marketplace: Manage"**
   - Click **"Create"**

7. **Copy Token**
   - Copy the token that appears (you won't see it again!)

---

## Method 3: Alternative - Manual Publishing (No Automation)

If you can't get the token working, you can still publish manually:

```bash
# 1. Build
npm run build

# 2. Package
npx vsce package

# 3. Publish manually to marketplace website
# Upload the .vsix file at:
# https://marketplace.visualstudio.com/manage
```

Then skip GitHub Actions setup and just use manual publishing.

---

## After Getting Your Token

### Add to GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `VSCE_PAT`
5. Value: Paste your token
6. Click **"Add secret"**

### Verify It Works

```bash
# Test publishing (dry run)
npx vsce publish --pat YOUR_TOKEN_HERE --dry-run

# If that works, the GitHub Actions will work too!
```

---

## Still Having Issues?

### Option A: Direct Links That Might Help

Try these direct URLs:
- Create Publisher: https://marketplace.visualstudio.com/manage/createpublisher
- Azure DevOps Settings: https://dev.azure.com/_usersSettings/tokens
- Or search for "Azure DevOps personal access tokens" in your browser

### Option B: Screenshot What You See

If you can share a screenshot of what you see when you go to dev.azure.com, I can provide more specific guidance.

### Option C: Contact VS Code Marketplace Support

If nothing works:
- Email: vsmarketplace@microsoft.com
- Explain you need help creating a Personal Access Token for publishing extensions

---

## Quick Test (After Setup)

Test if everything is configured:

```bash
# 1. Check vsce is installed
npx vsce --version

# 2. Check you're logged in
npx vsce ls-publishers

# 3. Try a dry-run publish
npx vsce publish --pat YOUR_TOKEN --dry-run
```

If step 3 succeeds, your token works and GitHub Actions will work!

---

## What If I Just Want to Publish Once?

If GitHub Actions seems too complicated, you can publish manually:

```bash
# One-time setup
npm install -g @vscode/vsce
npx vsce login fabriqa

# Every time you want to publish
npm version patch
npm run build
npx vsce publish
```

This works without any GitHub Actions setup!
