# Getting Started with Development

This guide will help you set up and run the fabriqa.ai markdown editor extension for development.

## Prerequisites

- Node.js 20+
- npm or yarn
- Visual Studio Code

## Initial Setup

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes (optional)
npm run watch
```

## Running the Extension

### Method 1: Press F5 (Recommended)

1. Open this project in VS Code
2. Press **F5** (or Run → Start Debugging)
3. This will:
   - Run the build task (`npm run build`)
   - Open a new "Extension Development Host" window

**Note:** The build task completes after building (unlike `watch` which runs continuously).

### Method 2: Manual Build + Debug

```bash
# Build first
npm run build

# Then press F5 in VS Code
```

## Testing the Extension

### Quick Test in Same Folder

1. Press **F5** to open Extension Development Host
2. In the new window: **File** → **Open Folder**
3. Navigate to this project folder
4. Click **Open** (ignore the "already open" warning)
5. Look for **FABRIQA** in the Activity Bar
6. Click to open the sidebar
7. Click any markdown file (e.g., `README.md`)

### Test with a Separate Test Workspace

Create a test folder with markdown files:

```bash
# Create test workspace
mkdir ~/Desktop/fabriqa-test
cd ~/Desktop/fabriqa-test

# Create config file
cat > .fabriqa.sidebar.yml << 'EOF'
sections:
  - id: docs
    title: DOCUMENTATION
    collapsed: false
    filePatterns:
      - "**/*.md"
EOF

# Create test markdown file
echo "# Test Document" > test.md
```

Then:
1. Press **F5** in VS Code (main window)
2. In Extension Development Host: **File** → **Open Folder** → `~/Desktop/fabriqa-test`
3. The FABRIQA sidebar should appear with your test files

## Debugging

### Extension Host Debugging

The extension host (Node.js code in `src/`) can be debugged:

1. Set breakpoints in `src/**/*.ts` files
2. Press **F5**
3. Breakpoints will hit when the code executes

### Webview Debugging

The webview (browser code in `webview/`) requires browser DevTools:

1. Press **F5** and open a markdown file
2. In the Extension Development Host window:
   - **Help** → **Toggle Developer Tools**
3. Click the **Console** tab
4. Look for messages prefixed with `[Webview]`

Example console output:
```
[Webview] Script loaded at 2025-11-19T...
[Webview] VS Code API acquired
[Webview] initializeEditor called
[Webview] Editor container found
[Webview] Initial mode: livePreview
[Webview] Creating EditorState...
[Webview] EditorView created successfully!
```

### Webview Console Logger

The extension includes a webview logger that captures all console output:

1. Open Command Palette: **Cmd/Ctrl+Shift+P**
2. Run: **Fabriqa: Show Webview Console Logs**
3. A text file opens with all webview console output

### Common Issues

**Issue: Editor shows "Loading..." forever**
- Open Developer Tools (Help → Toggle Developer Tools)
- Check Console for JavaScript errors
- Look for `[Webview]` messages to see where initialization stopped

**Issue: FABRIQA sidebar doesn't appear**
- Check the Output panel: View → Output → "Fabriqa Markdown Editor"
- Look for activation errors
- Verify `.fabriqa.sidebar.yml` or `.vscode/markdown-extension-config.json` exists

**Issue: Build fails**
- Delete `dist/` folder: `rm -rf dist`
- Delete `node_modules/`: `rm -rf node_modules`
- Reinstall: `npm install`
- Rebuild: `npm run build`

## Development Workflow

### Making Changes

1. **Extension Code** (`src/`):
   - Edit TypeScript files
   - Run `npm run build` or `npm run watch`
   - Reload Extension Development Host: **Cmd/Ctrl+R**

2. **Webview Code** (`webview/`):
   - Edit TypeScript files
   - Run `npm run build` or `npm run watch`
   - Reload Extension Development Host: **Cmd/Ctrl+R**
   - May need to close and reopen markdown file

3. **Styles** (`webview/styles/`):
   - Edit CSS files
   - Run build
   - Reload window and reopen file

### Hot Reload

Use watch mode for automatic rebuilding:

```bash
npm run watch
```

Then press **Cmd/Ctrl+R** in the Extension Development Host window to reload.

## Project Structure

```
fabriqa.ai-markdown-editor/
├── src/                      # Extension host code (Node.js)
│   ├── extension.ts          # Extension entry point
│   ├── config/               # Configuration management
│   ├── providers/            # Tree view & editor providers
│   ├── commands/             # Command handlers
│   └── utils/                # Utilities and logging
├── webview/                  # Webview code (browser)
│   ├── main.ts               # Webview entry point
│   ├── editors/              # Editor modes
│   │   ├── livePreviewMode.ts
│   │   ├── readingMode.ts
│   │   └── markdownCommands.ts
│   └── styles/               # CSS styles
├── dist/                     # Compiled output (gitignored)
├── specs/                    # Design docs and requirements
├── package.json              # Extension manifest
└── esbuild.js                # Build configuration
```

## Testing Commands

The extension provides several commands (accessible via Cmd/Ctrl+Shift+P):

- **Fabriqa: Open with Fabriqa Editor** - Open markdown file
- **Fabriqa: Switch to Live Preview Mode**
- **Fabriqa: Switch to Source Mode**
- **Fabriqa: Switch to Reading Mode**
- **Fabriqa: Refresh Tree View**
- **Fabriqa: Show Webview Console Logs**
- **Fabriqa: Editor Settings** (toolbar icon)

## Build Commands

```bash
# One-time build (development)
npm run build

# One-time build (production, minified)
npm run build -- --production

# Watch mode (rebuild on changes)
npm run watch

# Package for distribution
npm run package
```

## Next Steps

- Read `specs/requirements.md` for product requirements
- Read `specs/design.md` for architecture details
- Read `specs/tasks.md` for implementation task breakdown
- Check `README.md` for user-facing documentation

## Getting Help

If you encounter issues:

1. Check the **Output** panel (View → Output → "Fabriqa Markdown Editor")
2. Open **Developer Tools** (Help → Toggle Developer Tools)
3. Use the **Fabriqa: Show Webview Console Logs** command
4. Review debug messages in the console

Happy coding! 🚀
