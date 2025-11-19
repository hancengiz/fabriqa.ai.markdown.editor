# ✅ Extension Installed Globally!

## Success! 🎉

The **fabriqa.ai Markdown Editor** is now installed on your machine and will work in **any VS Code window**.

---

## How to Test It Now

### Step 1: Reload VS Code
**Close this VS Code window** and reopen it (or any other project folder).

OR press: `Cmd+Shift+P` → type "Reload Window" → Enter

### Step 2: Check It's Installed
1. Press `Cmd+Shift+X` (Extensions view)
2. Look for "fabriqa.ai Markdown Editor"
3. Should show as **installed** ✅

### Step 3: Look for FABRIQA Sidebar
After reload:
1. Press `Cmd+Shift+E` (Explorer view)
2. Look for **FABRIQA** section in the sidebar

If you don't see it, the config file is missing...

### Step 4: Create Config in Your Project

In ANY project where you want to use Fabriqa:

```bash
# Create config directory
mkdir -p .vscode

# Create config file
cat > .vscode/markdown-extension-config.json << 'EOF'
{
  "sections": [
    {
      "id": "docs",
      "title": "DOCUMENTATION",
      "collapsed": false,
      "files": [
        "README.md"
      ],
      "description": "Project documentation"
    },
    {
      "id": "notes",
      "title": "NOTES",
      "collapsed": false,
      "files": [],
      "description": "Development notes"
    }
  ]
}
EOF
```

After creating the config:
- Reload VS Code window
- **FABRIQA** section appears
- Shows "DOCUMENTATION" and "NOTES" sections

### Step 5: Test the Editor
1. Click any `.md` file in FABRIQA sidebar
2. Should open with custom editor
3. Try typing: `**bold**` and move cursor away
4. The `**` should hide (Live Preview mode)

---

## Commands Available

Press `Cmd+Shift+P` and type "Fabriqa":

- `Fabriqa: Open with Fabriqa Editor`
- `Fabriqa: Switch to Live Preview Mode`
- `Fabriqa: Switch to Source Mode`
- `Fabriqa: Switch to Reading Mode`
- `Fabriqa: Create New File`
- `Fabriqa: Refresh Tree View`

---

## Use It in This Project Right Now

This vscode-extension1 folder already has the config file!

1. **Close** this VS Code window
2. **Reopen** it: `code /Users/cengiz_han/workspace/code/personal_github/vscode-extension1`
3. **Look for FABRIQA** in sidebar (should appear automatically)
4. **Click TEST.md** or **requirements.md**
5. Should work! 🎉

---

## Keyboard Shortcuts

When editing markdown in Fabriqa:
- `Cmd+Shift+P` → Live Preview mode
- `Cmd+Shift+S` → Source mode
- `Cmd+Shift+R` → Reading mode

---

## Next: Test It!

**Close and reopen VS Code now** to see the installed extension in action!
