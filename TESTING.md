# Testing Guide for Kiro Markdown Editor

## Quick Start

### Method 1: Use VS Code's Debugger (Recommended)
1. Open this project in VS Code
2. Press **F5** (Start Debugging)
3. A new VS Code window opens (Extension Development Host)
4. In the new window:
   - Look for **KIRO** in the sidebar
   - Click on **TEST.md** to open it
   - The custom editor should load

### Method 2: Check Extension is Active
In the Extension Development Host window:
1. Open Command Palette (`Cmd+Shift+P`)
2. Type "Kiro"
3. You should see these commands:
   - Kiro: Open with Kiro Editor
   - Kiro: Switch to Live Preview Mode
   - Kiro: Switch to Source Mode
   - Kiro: Switch to Reading Mode
   - Kiro: Create New File
   - Kiro: Refresh Tree View

## What to Test

### 1. TreeView Sidebar
✅ **KIRO** section appears in Explorer sidebar
✅ Shows sections: SPECS, RESEARCH
✅ Files listed under each section
✅ Click file opens in custom editor

### 2. Custom Editor
✅ Opens markdown files
✅ Shows CodeMirror editor
✅ Can type and edit

### 3. Live Preview Mode (Default)
Move your cursor to different lines and watch:
- `**bold**` → Asterisks hide when cursor moves away
- `*italic*` → Single asterisk hides
- `[link](url)` → Brackets and URL hide, link text underlined
- `` `code` `` → Backticks hide, background styling applied
- `# Heading` → Hash marks hide
- `> quote` → Quote mark styled

### 4. Mode Switching

#### Via Toolbar (Top of editor)
- 👁️ Live Preview
- </> Source
- 📖 Reading

#### Via Keyboard
- `Cmd+Shift+P` → Live Preview
- `Cmd+Shift+S` → Source
- `Cmd+Shift+R` → Reading

#### Via Command Palette
- `Cmd+Shift+P` → Type "Kiro: Switch to..."

### 5. Source Mode
- All markdown syntax visible
- Syntax highlighting enabled
- No hiding or styling

### 6. Reading Mode
- Pure HTML preview
- No editing possible
- Rendered markdown

## Troubleshooting

### Extension Doesn't Load
1. Check Output panel (View → Output)
2. Select "Kiro Markdown Editor" from dropdown
3. Look for activation errors

### TreeView Not Showing
1. Make sure config file exists: `.vscode/markdown-extension-config.json`
2. Check file has valid JSON
3. Run command: "Kiro: Refresh Tree View"

### Files Don't Open
1. Right-click `.md` file
2. Select "Open With..."
3. Choose "Kiro Markdown Editor"

### Modes Don't Switch
1. Make sure you're in a Kiro editor (not default editor)
2. Check you see toolbar buttons at top
3. Try Command Palette instead of keyboard shortcuts

### Build Errors
```bash
npm run build
```
Should complete without errors.

## Debug Logs

Check these locations:
1. **Output Panel**: View → Output → "Kiro Markdown Editor"
2. **Developer Tools**: Help → Toggle Developer Tools → Console
3. **Extension Host**: In Extension Development Host window

## Expected Console Messages
```
[INFO] Kiro Markdown Editor activating...
[INFO] Kiro Markdown Editor activated successfully
[INFO] Opening custom editor for /path/to/file.md
[INFO] Webview ready
[INFO] Switched to livePreview mode
```

## Known Issues

### "Port 3456 already in use"
- This is from Claude Code extension, ignore it
- Doesn't affect Kiro extension

### Deprecation Warnings
- `punycode` warning is from dependencies
- Doesn't affect functionality
- Safe to ignore

## Success Checklist

- [ ] Extension Development Host opens
- [ ] KIRO sidebar appears
- [ ] Can open TEST.md
- [ ] Editor loads (see CodeMirror)
- [ ] Toolbar buttons visible
- [ ] Can type and edit
- [ ] **Bold** syntax hides (Live Preview)
- [ ] Can switch to Source mode
- [ ] Can switch to Reading mode
- [ ] Keyboard shortcuts work

## Next Steps After Testing

If everything works:
✅ Continue to Phase 3 (Configuration & File Watching)

If issues found:
🐛 Report specific error messages for debugging
