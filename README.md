# Fabriqa.ai Markdown Editor

An Obsidian-like markdown editor extension for Visual Studio Code with three editing modes:

- **Live Preview**: Cursor-based syntax revealing (markdown syntax appears only on the line with the cursor)
- **Source Mode**: Full markdown source with all syntax visible
- **Reading Mode**: Pure HTML preview (read-only)

## Features

- 📝 **Three Editing Modes**: Switch seamlessly between Live Preview, Source, and Reading modes
- 🎯 **Config-Driven Sidebar**: Organize markdown files by sections using `.vscode/markdown-extension-config.json`
- 🎨 **VS Code Theme Integration**: Automatically adapts to your VS Code theme
- ⚡ **CodeMirror 6**: Powered by the modern CodeMirror 6 editor
- 🔒 **Secure**: Content Security Policy and DOMPurify sanitization
- 📁 **File Operations**: Create, rename, and delete files directly from the sidebar

## Getting Started

### 1. Create Configuration File

Create a `.vscode/markdown-extension-config.json` file in your workspace:

```json
{
  "sections": [
    {
      "id": "specs",
      "title": "SPECS",
      "collapsed": false,
      "files": [
        "docs/requirements.md",
        "docs/design.md"
      ],
      "description": "Build complex features with structured planning"
    },
    {
      "id": "notes",
      "title": "NOTES",
      "collapsed": false,
      "files": [
        "notes/daily.md",
        "notes/ideas.md"
      ],
      "description": "Personal notes and ideas"
    }
  ]
}
```

### 2. Open Markdown Files

- Click on any file in the **FABRIQA** sidebar to open it with the custom editor
- Or right-click a `.md` file and select "Open with Fabriqa Editor"

### 3. Switch Modes

Use the toolbar buttons at the top of the editor:
- 👁️ **Live Preview**: Interactive editing with syntax hiding
- </> **Source**: Full markdown source
- 📖 **Reading**: HTML preview

## Configuration

Configure the extension in VS Code settings (`Cmd/Ctrl + ,`):

- `fabriqa.configFile`: Path to config file (default: `.vscode/markdown-extension-config.json`)
- `fabriqa.defaultMode`: Default editing mode (`livePreview`, `source`, or `reading`)
- `fabriqa.theme`: Editor theme (`auto`, `light`, or `dark`)
- `fabriqa.fontSize`: Font size for the editor (default: 14)
- `fabriqa.lineHeight`: Line height multiplier (default: 1.6)
- `fabriqa.autoSave`: Auto-save changes (default: true)

## Development

### Prerequisites

- Node.js 20+
- npm or yarn
- Visual Studio Code

### Setup

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Watch for changes
npm run watch

# Run tests
npm test
```

### Project Structure

```
vscode-extension1/
├── src/
│   ├── extension.ts           # Extension entry point
│   ├── config/
│   │   ├── ConfigManager.ts   # Config file handling
│   │   └── types.ts           # Type definitions
│   ├── providers/
│   │   ├── MarkdownTreeProvider.ts      # Sidebar tree view
│   │   └── MarkdownEditorProvider.ts    # Custom editor
│   ├── commands/
│   │   └── index.ts           # Command registrations
│   └── utils/
│       └── Logger.ts          # Logging utility
├── webview/
│   ├── main.ts                # Webview entry point
│   └── editors/
│       ├── livePreviewMode.ts # Live preview plugin
│       └── readingMode.ts     # Reading mode plugin
├── specs/
│   ├── requirements.md        # Product requirements
│   ├── design.md             # Technical design
│   └── tasks.md              # Implementation tasks
└── package.json

```

## Architecture

The extension uses VS Code's Custom Editor API with a webview-based editor:

1. **Extension Host** (Node.js): Handles file operations, configuration, and VS Code integration
2. **Webview** (Browser): Runs CodeMirror 6 editor with custom plugins
3. **Communication**: Messages between extension host and webview for synchronization

## Technology Stack

- **Editor**: CodeMirror 6
- **Markdown Parsing**: @lezer/markdown
- **HTML Rendering**: marked.js + DOMPurify
- **Build Tool**: esbuild
- **Language**: TypeScript

## Commands

- `Fabriqa: Open with Fabriqa Editor` - Open markdown file with custom editor
- `Fabriqa: Switch to Live Preview Mode` - Switch to live preview
- `Fabriqa: Switch to Source Mode` - Switch to source mode
- `Fabriqa: Switch to Reading Mode` - Switch to reading mode
- `Fabriqa: Create New File` - Create new markdown file
- `Fabriqa: Delete File` - Delete selected file
- `Fabriqa: Rename File` - Rename selected file
- `Fabriqa: Refresh Tree View` - Refresh sidebar

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## Credits

Inspired by [Obsidian](https://obsidian.md/) markdown editor.
