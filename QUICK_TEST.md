# 🚀 Quick Test - 2 Minutes

## Step 1: Launch Extension (Pick one method)

### Method A: From VS Code
```bash
# Make sure you're in the project directory
cd /Users/cengiz_han/workspace/code/personal_github/vscode-extension1

# Open in VS Code
code .

# Press F5 to launch debugger
```

### Method B: From Command Line
```bash
code --extensionDevelopmentPath="$(pwd)" "$(pwd)"
```

## Step 2: Verify Extension Loaded

In the **NEW window** that opens (Extension Development Host):

### ✅ Check 1: Sidebar
- Look at left sidebar (Explorer view)
- You should see **"KIRO"** section
- Under it: SPECS, RESEARCH sections
- Files listed under each

**🎉 If you see this → Extension is working!**

### ✅ Check 2: Open Test File
- Click on **TEST.md** in the KIRO sidebar
- OR use Command Palette: `Kiro: Open with Kiro Editor`
- OR right-click any `.md` file → "Open With..." → "Kiro Markdown Editor"

### ✅ Check 3: Verify Editor
You should see:
- CodeMirror editor with syntax highlighting
- Toolbar at top with 3 buttons: 👁️ </> 📖
- Can type and edit

### ✅ Check 4: Test Live Preview
Type this in the editor:
```markdown
**This is bold text**
*This is italic*
[Click here](https://example.com)
```

Now **move your cursor** to a different line:
- The `**` around bold should disappear
- The `*` around italic should disappear
- The `[]()` around link should disappear

**🎉 If syntax hides → Live Preview is working!**

### ✅ Check 5: Test Mode Switching
- Press `Cmd+Shift+S` (or click </> button)
- All syntax should become visible = **Source Mode**
- Press `Cmd+Shift+R` (or click 📖 button)
- Should show HTML preview = **Reading Mode**
- Press `Cmd+Shift+P` (or click 👁️ button)
- Back to Live Preview

## ❌ If Something Doesn't Work

### TreeView (KIRO sidebar) not showing?
```bash
# Check config file exists
cat .vscode/markdown-extension-config.json
```

### Extension not activating?
1. Open Developer Tools: `Help → Toggle Developer Tools`
2. Go to Console tab
3. Look for errors with "Kiro" in them
4. **OR** Check: `View → Output → Select "Kiro Markdown Editor"`

### Still not working?
Share the error message from:
- Output panel (View → Output → "Kiro Markdown Editor")
- OR Console (Help → Toggle Developer Tools → Console)

## 🎯 Success = All 5 Checks Pass

If all checks pass, you have a working extension with:
✅ Config-driven sidebar
✅ Custom markdown editor
✅ Live Preview mode with syntax hiding
✅ Source and Reading modes
✅ Keyboard shortcuts
✅ Mode switching

**Ready for Phase 3!** 🚀
