# Changelog

All notable changes to the "fabriqa.ai Markdown Editor" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-19

### Added

#### Core Features
- **Three Editing Modes**
  - Live Preview: Cursor-based syntax revealing (Obsidian-style)
  - Source Mode: Full markdown source with syntax highlighting
  - Reading Mode: Clean HTML preview (read-only)
- **Mode Switching**
  - Keyboard shortcuts: Cmd/Ctrl+Shift+P (Live Preview), Cmd/Ctrl+Shift+S (Source), Cmd/Ctrl+Shift+R (Reading)
  - Toolbar buttons for quick mode switching
  - Settings menu for mode selection

#### Sidebar & File Management
- **Config-Driven Sidebar**
  - YAML configuration (`.fabriqa.sidebar.yml`)
  - JSON configuration (`.vscode/markdown-extension-config.json`)
  - Dynamic sections with glob patterns
  - Auto-refresh on file changes
- **File Operations**
  - Create new markdown files
  - Rename files
  - Delete files with confirmation
  - Context menu integration

#### Editor Features
- **CodeMirror 6 Integration**
  - Modern, performant editor
  - Markdown syntax highlighting
  - Line numbers
  - Auto-completion
  - Bracket matching
  - Search and replace
- **Markdown Commands** (Cmd+Option on Mac, Ctrl+Alt on Windows/Linux)
  - Note: Using Cmd+Option to avoid conflicts with VS Code (Cmd+B = sidebar, Cmd+Shift+B = build task)
  - Bold (⌘⌥B / Ctrl+Alt+B), italic (⌘⌥I / Ctrl+Alt+I), strikethrough (⌘⌥X / Ctrl+Alt+X)
  - Headings (⌘⌥H / Ctrl+Alt+H to toggle H1-H6)
  - Inline code (⌘⌥C / Ctrl+Alt+C) and code blocks (⌘⌥E / Ctrl+Alt+E)
  - Links (⌘⌥K / Ctrl+Alt+K)
  - Bullet lists (⌘⌥8 / Ctrl+Alt+8) and numbered lists (⌘⌥7 / Ctrl+Alt+7)
  - Blockquotes (⌘⌥Q / Ctrl+Alt+Q)
  - Checkboxes/Task lists (⌘⌥T / Ctrl+Alt+T) - GitHub-flavored markdown `- [ ]` / `- [x]`
- **Live Preview Features**
  - Hide markdown syntax on lines without cursor
  - Instant reveal when cursor moves to line
  - Smooth transitions

#### Reading Mode
- **HTML Rendering**
  - GitHub Flavored Markdown (GFM) support
  - Tables, task lists, strikethrough
  - Sanitized HTML output (DOMPurify)
  - Clean, readable typography

#### Integration & Polish
- **VS Code Integration**
  - Custom editor for `.md` files
  - Activity bar icon
  - Command palette integration
  - Settings UI
- **Theme Support**
  - Automatic light/dark theme detection
  - Synchronized with VS Code theme
- **Developer Tools**
  - Console logging to VS Code Output panel
  - Webview console logger command
  - Debug logging for development

#### Configuration Options
- `fabriqa.defaultMode`: Default editing mode (livePreview/source/reading)
- `fabriqa.fontSize`: Font size for editor (8-32px)
- `fabriqa.lineHeight`: Line height multiplier (1-3)
- `fabriqa.sidebarSections`: Configure sidebar sections with glob patterns

### Technical
- Built with TypeScript 5.x
- CodeMirror 6 for editing
- marked.js + DOMPurify for HTML rendering
- esbuild for fast compilation
- Supports VS Code 1.85.0+

### Known Issues
- Multi-root workspace support not yet implemented
- No search/filter in TreeView yet
- Extension icon is SVG (may need PNG for marketplace)

## [Unreleased]

### Planned Features
- Multi-root workspace support
- TreeView search and filtering
- Unit and integration tests
- Performance optimizations
- Math equation support (KaTeX)
- Diagram support (Mermaid)
- Split view (side-by-side editing)

---

[0.1.0]: https://github.com/yourusername/fabriqa.ai-markdown-editor/releases/tag/v0.1.0
