# fabriqa.ai markdown editor

Official website: [https://fabriqa.ai](https://fabriqa.ai)

An Obsidian-like markdown editor extension for Visual Studio Code with three editing modes:

- **Live Preview**: Cursor-based syntax revealing (markdown syntax appears only on the line with the cursor)
- **Source Mode**: Full markdown source with all syntax visible
- **Reading Mode**: Pure HTML preview (read-only)

## Screenshots

### Organized Sidebar & Live Preview Mode
![fabriqa.ai sidebar with markdown files organized by sections](https://raw.githubusercontent.com/hancengiz/fabriqa.ai-markdown-editor/master/screenshots/screenshot-1.png)

The extension provides a custom sidebar to organize your markdown files by sections using glob patterns. Files are automatically discovered and grouped based on your configuration.

### Mode Switching Menu
![Mode switching menu showing Live Preview, Source, and Reading modes](https://raw.githubusercontent.com/hancengiz/fabriqa.ai-markdown-editor/master/screenshots/screenshot-2.png)

Quickly switch between editing modes using the settings menu in the editor toolbar, or use keyboard shortcuts for faster navigation.

### Mermaid Diagram Support
![Mermaid sequence diagram rendered in Live Preview mode with View Code button](https://raw.githubusercontent.com/hancengiz/fabriqa.ai-markdown-editor/master/screenshots/screenshot-3.png)

Create beautiful diagrams using Mermaid syntax. In Live Preview mode, diagrams are rendered automatically with a "View Code" button to toggle back to source. Supports all Mermaid diagram types: flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, pie charts, and more.

## Features

- 📝 **Three Editing Modes**: Switch seamlessly between Live Preview, Source, and Reading modes
- 📊 **Mermaid Diagrams**: Full support for all Mermaid diagram types with live rendering and "View Code" toggle
- 📋 **Advanced Table Editing**: Create, edit, and navigate markdown tables with intuitive keyboard shortcuts
- 🎯 **Config-Driven Sidebar**: Organize markdown files by sections using `.vscode/fabriqa-markdown-editor-config.json`
- 🔍 **Integrated Search**: Native VS Code find (Cmd+F) with smart content reveal in diagrams and hidden elements
- ✅ **Interactive Checkboxes**: Click to toggle task list items directly in Live Preview mode
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

## Table Editing

The fabriqa Markdown Editor provides comprehensive table editing support with intuitive keyboard shortcuts:

### Creating Tables
- Press `Cmd+Shift+T` / `Ctrl+Shift+T` to insert a new 3x3 table at the cursor position
- Tables are automatically formatted with proper markdown syntax

### Navigating Tables
- **Tab**: Move to the next cell (automatically adds a new row when at the end of the table)
- **Shift+Tab**: Move to the previous cell
- Navigation is smart and wraps around rows appropriately

### Adding Rows and Columns
- `Cmd+Shift+↑` / `Ctrl+Shift+↑` - Insert row above current row
- `Cmd+Shift+↓` / `Ctrl+Shift+↓` - Insert row below current row
- `Cmd+Shift+←` / `Ctrl+Shift+←` - Insert column to the left
- `Cmd+Shift+→` / `Ctrl+Shift+→` - Insert column to the right

### Deleting Rows and Columns
- `Cmd+Shift+Backspace` / `Ctrl+Shift+Backspace` - Delete current row
- `Cmd+Shift+Delete` / `Ctrl+Shift+Delete` - Delete current column

### Formatting Tables
- `Cmd+Alt+F` / `Ctrl+Alt+F` - Format table (aligns all columns for better readability)

### Table Editing Features
- Automatically preserves column alignment settings (left, center, right)
- Smart detection of table boundaries
- Protects header and separator rows from deletion
- Prevents deletion of the last column or row (maintains table structure)

## Search & Find

The fabriqa Markdown Editor includes powerful search capabilities that integrate seamlessly with VS Code's native find experience:

### In-Document Search
- **Quick Find**: Press `Cmd+F` / `Ctrl+F` to search within the current document
- **Search from Cursor**: Searches start from your current cursor position and wrap around to the beginning if needed
- **Search History**: Your last search term is automatically remembered and pre-filled when you open find again
- **Smart Navigation**: Both `Cmd+F` + Enter and `F3` behave identically - use whichever feels more natural
- **Find Previous**: Use `Shift+F3` to search backward
- **Clear Search**: Press `Escape` to clear search highlights

### Intuitive Search Workflow
The search behavior is designed to feel natural and efficient:

1. **First Search**: Press `Cmd+F`, type "keyword", press Enter → finds first match after cursor
2. **Quick Next**: Press `Cmd+F` again → your search term is pre-filled, just press Enter to find next
3. **Or Use F3**: Alternatively, press `F3` directly for the same "find next" behavior

This unified approach means both `Cmd+F` + Enter and `F3` do the exact same thing, giving you flexibility in your workflow.

### Global Search (Cmd+Shift+F)
When using VS Code's global search (`Cmd+Shift+F` / `Ctrl+Shift+F`):

- Search results in markdown files automatically open with the fabriqa editor
- **Note**: Due to VS Code's Custom Editor API limitations, the editor cannot automatically jump to the specific search result location
- **Workaround**: After the file opens, use in-document search (`Cmd+F`) to find your search term
- This is a known limitation of VS Code's Custom Editor API that affects all custom editors

### Smart Content Reveal
Search intelligently reveals hidden content:

- **Mermaid Diagrams**: Searching text inside a diagram automatically reveals the source code
- **Collapsed Sections**: Hidden markdown syntax becomes visible when found
- **Live Preview Mode**: Maintains the live preview experience while showing search matches

## Keyboard Shortcuts

### Mode Switching
- `Cmd+Shift+P` / `Ctrl+Shift+P` - Switch to Live Preview
- `Cmd+Shift+S` / `Ctrl+Shift+S` - Switch to Source Mode
- `Cmd+Shift+R` / `Ctrl+Shift+R` - Switch to Reading Mode

### Search & Navigation
- `Cmd+F` / `Ctrl+F` - Find in document
- `F3` - Find next
- `Shift+F3` - Find previous
- `Escape` - Clear search
- `Cmd+Shift+F` / `Ctrl+Shift+F` - Global search (VS Code native)

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

### Table Editing
- `Cmd+Shift+T` / `Ctrl+Shift+T` - Insert new table (3x3)
- `Tab` - Navigate to next cell (auto-creates row at end)
- `Shift+Tab` - Navigate to previous cell
- `Cmd+Shift+↑` / `Ctrl+Shift+↑` - Insert row above
- `Cmd+Shift+↓` / `Ctrl+Shift+↓` - Insert row below
- `Cmd+Shift+←` / `Ctrl+Shift+←` - Insert column left
- `Cmd+Shift+→` / `Ctrl+Shift+→` - Insert column right
- `Cmd+Shift+Backspace` / `Ctrl+Shift+Backspace` - Delete row
- `Cmd+Shift+Delete` / `Ctrl+Shift+Delete` - Delete column
- `Cmd+Option+F` / `Ctrl+Alt+F` - Format table

### Code Editing (CodeMirror Standard Shortcuts)
- `Option+Up` / `Alt+Up` - Move line up
- `Option+Down` / `Alt+Down` - Move line down
- `Option+Shift+Up` / `Alt+Shift+Up` - Duplicate line above
- `Option+Shift+Down` / `Alt+Shift+Down` - Duplicate line below
- `Cmd+Shift+K` / `Ctrl+Shift+K` - Delete current line
- `Cmd+Enter` / `Ctrl+Enter` - Insert line below
- `Cmd+Shift+Enter` / `Ctrl+Shift+Enter` - Insert line above
- `Cmd+D` / `Ctrl+D` - Select next occurrence
- `Cmd+U` / `Ctrl+U` - Undo last cursor operation
- `Cmd+/` / `Ctrl+/` - Toggle line comment
- `Cmd+[` / `Ctrl+[` - Decrease indent
- `Cmd+]` / `Ctrl+]` - Increase indent

### History
- `Cmd+Z` / `Ctrl+Z` - Undo
- `Cmd+Shift+Z` / `Ctrl+Shift+Z` - Redo
- `Cmd+Y` / `Ctrl+Y` - Redo (alternative)

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

## Credits

Inspired by [Obsidian](https://obsidian.md/) markdown editor.
