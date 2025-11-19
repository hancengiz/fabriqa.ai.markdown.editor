# fabriqa.ai Markdown Editor

An Obsidian-like markdown editor extension for Visual Studio Code with three editing modes:

- **Live Preview**: Cursor-based syntax revealing (markdown syntax appears only on the line with the cursor)
- **Source Mode**: Full markdown source with all syntax visible
- **Reading Mode**: Pure HTML preview (read-only)

## Screenshots

### Organized Sidebar & Live Preview Mode
![fabriqa.ai sidebar with markdown files organized by sections](screenshots/screenshot-1.png)

The extension provides a custom sidebar to organize your markdown files by sections using glob patterns. Files are automatically discovered and grouped based on your configuration.

### Mode Switching Menu
![Mode switching menu showing Live Preview, Source, and Reading modes](screenshots/screenshot-2.png)

Quickly switch between editing modes using the settings menu in the editor toolbar, or use keyboard shortcuts for faster navigation.

## Features

- 📝 **Three Editing Modes**: Switch seamlessly between Live Preview, Source, and Reading modes
- 🎯 **Config-Driven Sidebar**: Organize markdown files by sections using `.vscode/fabriqa-markdown-editor-config.json`
- 🎨 **VS Code Theme Integration**: Automatically adapts to your VS Code theme
- ⚡ **CodeMirror 6**: Powered by the modern CodeMirror 6 editor
- 🔒 **Secure**: Content Security Policy and DOMPurify sanitization
- 📁 **File Operations**: Create, rename, and delete files directly from the sidebar

## Getting Started

### 1. (Optional) Create Configuration File

To organize your markdown files into custom sections in the sidebar, create a `.vscode/fabriqa-markdown-editor-config.json` file in your workspace:

```json
{
  "sections": [
    {
      "id": "specs",
      "title": "SPECS",
      "collapsed": false,
      "filePatterns": [
        "specs/**/*.md"
      ],
      "description": "Build complex features with structured planning"
    },
    {
      "id": "notes",
      "title": "NOTES",
      "collapsed": false,
      "filePatterns": [
        "notes/**/*.md"
      ],
      "description": "Personal notes and ideas"
    }
  ]
}
```

**Note**: Use `filePatterns` with glob patterns for automatic file discovery. Files are discovered automatically - no need to list them individually!

### 2. Open Markdown Files

- Click on any file in the **fabriqa** sidebar to open it with the custom editor
- Or right-click a `.md` file and select "Open with fabriqa Editor"

### 3. Switch Modes

Use the toolbar buttons at the top of the editor:
- 👁️ **Live Preview**: Interactive editing with syntax hiding
- </> **Source**: Full markdown source
- 📖 **Reading**: HTML preview

## Configuration

Configure the extension in VS Code settings (`Cmd/Ctrl + ,`):

- `fabriqa.defaultMode`: Default editing mode (`livePreview`, `source`, or `reading`)
- `fabriqa.fontSize`: Font size for the editor (default: 14)
- `fabriqa.lineHeight`: Line height multiplier (default: 1.6)
- `fabriqa.sidebarSections`: Configure sidebar sections with glob patterns

## Keyboard Shortcuts

### Mode Switching
- `Cmd+Shift+P` / `Ctrl+Shift+P` - Switch to Live Preview
- `Cmd+Shift+S` / `Ctrl+Shift+S` - Switch to Source Mode
- `Cmd+Shift+R` / `Ctrl+Shift+R` - Switch to Reading Mode

### Markdown Formatting (Cmd+Option on Mac, Ctrl+Alt on Windows/Linux)
- `Cmd+Option+B` / `Ctrl+Alt+B` - Bold
- `Cmd+Option+I` / `Ctrl+Alt+I` - Italic
- `Cmd+Option+X` / `Ctrl+Alt+X` - Strikethrough
- `Cmd+Option+C` / `Ctrl+Alt+C` - Inline code
- `Cmd+Option+E` / `Ctrl+Alt+E` - Code block
- `Cmd+Option+K` / `Ctrl+Alt+K` - Insert link
- `Cmd+Option+H` / `Ctrl+Alt+H` - Toggle heading (cycles H1-H6)
- `Cmd+Option+8` / `Ctrl+Alt+8` - Bullet list
- `Cmd+Option+7` / `Ctrl+Alt+7` - Numbered list
- `Cmd+Option+Q` / `Ctrl+Alt+Q` - Blockquote
- `Cmd+Option+T` / `Ctrl+Alt+T` - Toggle checkbox

## Commands

- `fabriqa: Open with fabriqa Editor` - Open markdown file with custom editor
- `fabriqa: Switch to Live Preview Mode` - Switch to live preview
- `fabriqa: Switch to Source Mode` - Switch to source mode
- `fabriqa: Switch to Reading Mode` - Switch to reading mode
- `fabriqa: Create New File` - Create new markdown file
- `fabriqa: Delete File` - Delete selected file
- `fabriqa: Rename File` - Rename selected file
- `fabriqa: Refresh Tree View` - Refresh sidebar

## License

MIT

## Contributing

Contributions are welcome! See [DEVELOPMENT.md](DEVELOPMENT.md) for development setup and guidelines.

## Credits

Inspired by [Obsidian](https://obsidian.md/) markdown editor.
