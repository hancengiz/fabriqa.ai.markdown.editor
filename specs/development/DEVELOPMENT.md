# Development Guide

## Architecture Overview

The fabriqa.ai markdown editor is a VS Code extension with a two-part architecture:

### 1. Extension Host (Node.js)
Located in `src/`, runs in VS Code's Node.js process:
- **`src/extension.ts`** - Entry point, activation, command registration
- **`src/providers/`** - TreeView and Custom Editor providers
- **`src/commands/`** - All command implementations
- **`src/config/`** - Configuration loading and management
- **`src/utils/`** - Logger and utilities

### 2. Webview (Browser)
Located in `webview/`, runs in an isolated browser context:
- **`webview/main.ts`** - CodeMirror initialization, message handling, mode management
- **`webview/editors/`** - Editor mode plugins
  - `livePreviewMode.ts` - Cursor-based syntax hiding
  - `readingMode.ts` - HTML rendering
  - `markdownCommands.ts` - Formatting commands

## Communication Flow

```
Extension Host (Node.js)          Webview (Browser)
        │                                │
        │─────── init (content) ─────────>│
        │                                │ Initialize CodeMirror
        │                                │
        │<─────── ready ──────────────────│
        │                                │
        │                                │ User edits
        │<─────── edit (content) ─────────│
        │                                │
        │ Save to document               │
        │                                │
        │─────── update (content) ────────>│
        │                                │ Update editor
        │                                │
        │                                │ User switches mode
        │<─────── modeChanged ────────────│
        │                                │
        │─────── switchMode ──────────────>│
        │                                │ Reconfigure CodeMirror
```

## Key Components

### MarkdownTreeProvider (`src/providers/MarkdownTreeProvider.ts`)
- Implements `vscode.TreeDataProvider`
- Reads config from `.fabriqa.sidebar.yml` or `.vscode/markdown-extension-config.json`
- Builds folder hierarchy from glob patterns
- Shows sections → folders → files
- Supports nested subfolders

### MarkdownEditorProvider (`src/providers/MarkdownEditorProvider.ts`)
- Implements `vscode.CustomTextEditorProvider`
- Creates webview with CodeMirror editor
- Handles document synchronization
- Manages message passing with webview

### ConfigManager (`src/config/ConfigManager.ts`)
- Loads configuration from YAML or JSON
- Supports glob patterns for dynamic file discovery
- Default config if no file found
- File watching for auto-refresh

### CodeMirror Editor (`webview/main.ts`)
- CodeMirror 6 setup with markdown language support
- Extension compartments for dynamic mode switching
- Message handling for VS Code communication
- Console logging forwarded to extension

## Data Flow

### File Discovery
```
1. Extension activates
2. ConfigManager loads .fabriqa.sidebar.yml
3. For each section, glob patterns find matching files
4. TreeProvider builds folder hierarchy
5. TreeView displays sections → folders → files
```

### File Editing
```
1. User clicks file in TreeView
2. TreeProvider triggers fabriqa.openMarkdownEditor command
3. MarkdownEditorProvider creates webview
4. Webview loads CodeMirror with document content
5. User edits → webview sends 'edit' message
6. Extension updates document → document saves
```

### Mode Switching
```
1. User clicks toolbar button or uses keyboard shortcut
2. Command triggers in extension
3. Extension sends 'switchMode' message to webview
4. Webview reconfigures CodeMirror extensions via Compartment
5. Editor switches between Live Preview / Source / Reading
```

## Configuration

### YAML Config (`.fabriqa.sidebar.yml`)
```yaml
sections:
  - id: specs
    title: SPECS
    collapsed: false
    filePatterns:
      - specs/**/*.md
    description: "Project specifications"
```

### JSON Config (`.vscode/markdown-extension-config.json`)
```json
{
  "sections": [
    {
      "id": "specs",
      "title": "SPECS",
      "collapsed": false,
      "filePatterns": ["specs/**/*.md"],
      "description": "Project specifications"
    }
  ]
}
```

## Building

```bash
# Install dependencies
npm install

# Development build (with source maps)
npm run build

# Production build (minified)
npm run build -- --production

# Watch mode (auto-rebuild on changes)
npm run watch
```

### Build Output
- `dist/extension.js` - Extension host code (Node.js)
- `dist/webview.js` - Webview code (browser)

## Debugging

### Extension Host
1. Press **F5** to launch Extension Development Host
2. Set breakpoints in `src/**/*.ts` files
3. Breakpoints hit when code executes in VS Code process

### Webview
1. Open markdown file in custom editor
2. **Help → Toggle Developer Tools**
3. Look for `[Webview]` console messages
4. Set breakpoints in Sources tab (webpack:///)

### Webview Logger
- Command: **fabriqa: Show Webview Console Logs**
- Opens file with all webview console output
- Useful for debugging without DevTools

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run with coverage
npm test -- --coverage
```

### Test Structure
```
tests/
├── unit/
│   ├── config/
│   ├── providers/
│   └── commands/
├── integration/
│   └── extension.test.ts
└── fixtures/
    └── test-workspace/
```

## Adding Features

### Adding a New Command

1. **Register command** in `src/commands/index.ts`:
```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('fabriqa.myCommand', async () => {
    // Implementation
  })
);
```

2. **Add to package.json**:
```json
{
  "contributes": {
    "commands": [{
      "command": "fabriqa.myCommand",
      "title": "My Command",
      "category": "fabriqa"
    }]
  }
}
```

### Adding a New Editor Mode

1. **Create mode plugin** in `webview/editors/`:
```typescript
// webview/editors/myMode.ts
export const myModePlugin = /* ... */;
```

2. **Add to mode extensions** in `webview/main.ts`:
```typescript
function getModeExtensions(mode: EditorMode) {
  switch (mode) {
    case 'myMode':
      return [myModePlugin];
    // ...
  }
}
```

3. **Add command** to switch to mode
4. **Update package.json** with command and keybinding

## File Structure

```
fabriqa.ai-markdown-editor/
├── src/                          # Extension host code (Node.js)
│   ├── commands/
│   │   └── index.ts              # All commands
│   ├── config/
│   │   ├── ConfigManager.ts      # Config loading
│   │   └── types.ts              # Type definitions
│   ├── providers/
│   │   ├── MarkdownTreeProvider.ts    # TreeView
│   │   └── MarkdownEditorProvider.ts  # Custom editor
│   ├── utils/
│   │   ├── Logger.ts             # Output channel logger
│   │   └── WebviewLogger.ts      # Webview console capture
│   └── extension.ts              # Entry point
│
├── webview/                      # Webview code (Browser)
│   ├── editors/
│   │   ├── livePreviewMode.ts    # Live preview plugin
│   │   ├── readingMode.ts        # Reading mode plugin
│   │   └── markdownCommands.ts   # Formatting commands
│   ├── styles/
│   │   └── editor.css            # Editor styles
│   └── main.ts                   # CodeMirror + message handling
│
├── resources/                    # Icons and assets
│   ├── icon.svg                  # Extension icon
│   ├── activity-bar-icon.svg     # Activity bar icon
│   └── fabriqa-toolbar-icon.svg  # Toolbar icon
│
├── specs/                        # Design docs
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   └── development/
│       └── DEVELOPMENT.md        # Development guide
│
├── dist/                         # Build output (gitignored)
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
└── esbuild.js                    # Build configuration
```

## Common Issues

### Webview not loading
- Check console for `[Webview]` messages
- Verify `dist/webview.js` exists
- Check CSP errors in DevTools

### TreeView not showing files
- Verify glob patterns in config
- Check file paths are relative to workspace root
- Look for errors in Output panel

### Mode switching not working
- Check if `switchMode()` message received in webview
- Verify mode extensions configured correctly
- Look for CodeMirror errors in console

## Performance

- CodeMirror 6 handles viewport rendering (efficient for large files)
- TreeView builds folder hierarchy on-demand
- File watching uses VS Code's native file system watcher
- Debounced document synchronization (prevents excessive updates)

## Security

- Content Security Policy restricts webview scripts
- HTML sanitization with DOMPurify in reading mode
- No eval() or unsafe code execution
- Resources loaded via `webview.asWebviewUri()`

## Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run tests: `npm test`
- [ ] Build production: `npm run build -- --production`
- [ ] Test in Extension Development Host
- [ ] Package: `npm run package`
- [ ] Test VSIX locally
- [ ] Create GitHub release
- [ ] Publish to marketplace

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open Pull Request

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [CodeMirror 6 Docs](https://codemirror.net/6/)
- [Custom Editors Guide](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [TreeView Guide](https://code.visualstudio.com/api/extension-guides/tree-view)

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/fabriqa.ai-markdown-editor/issues)
- Ask questions: [Discussions](https://github.com/yourusername/fabriqa.ai-markdown-editor/discussions)
