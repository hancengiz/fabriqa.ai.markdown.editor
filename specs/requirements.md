# Product Requirements Document (PRD)
## VS Code Markdown Documentation Extension

**Version**: 2.0
**Last Updated**: November 19, 2025
**Status**: Draft - Updated to CodeMirror 6

---

## 1. Overview

### 1.1 Product Vision
A VS Code extension that provides an Obsidian-inspired markdown editing experience with a custom sidebar for organizing documentation across multiple categories (specs, agents, commands, bolts).

### 1.2 Core Value Proposition
- **Unified documentation management** within VS Code workspace
- **Obsidian-like markdown editing** with Live Preview, Source, and Reading modes
- **Config-driven file organization** for flexible project structures
- **Custom sidebar view** for quick navigation across documentation types
- **CodeMirror 6 powered** editor with three distinct editing modes

### 1.3 Target Users
- Software engineers managing technical documentation
- Teams using markdown for specs, agent definitions, and commands
- Developers who want document-style editing within VS Code

---

## 2. User Experience

### 2.1 Sidebar View (Tree View)

#### Visual Design Reference
Based on the provided screenshot (KIRO-style sidebar), the extension provides:

```
📁 Extension Name
  ▼ SPECS                    [+] [⋯]
    📄 feature-a.md
    📄 architecture.md

  ▼ AGENTS                   [+] [⋯]
    📄 code-reviewer.md
    📄 test-generator.md

  ▼ COMMANDS                 [+] [⋯]
    📄 deploy.md
    📄 build.md

  ▼ BOLTS                    [+] [⋯]
    📄 api-integration.md
    📄 database-migration.md
```

#### Interaction Patterns

| Action | Behavior |
|--------|----------|
| **Single click** on file | Select/highlight the file |
| **Double click** on file | Open in custom CodeMirror 6 editor tab |
| **Click section header** | Collapse/expand section |
| **Click [+] button** | Create new markdown file in that section |
| **Click [⋯] button** | Section context menu (settings, refresh, etc.) |
| **Right-click file** | File context menu (rename, delete, etc.) |

### 2.2 Markdown Editor

#### Editor Modes
Built with **CodeMirror 6** for authentic Obsidian-like experience with three distinct modes:

**Mode 1: Live Preview** (Default)
- Cursor-based syntax revealing
- Shows formatted text everywhere EXCEPT the line with cursor
- Current line displays raw markdown (`**bold**`, `_italic_`, etc.)
- Click anywhere → cursor moves → syntax reveals for that line
- Move cursor away → returns to formatted view
- True hybrid editing experience

**Mode 2: Source Mode**
- Raw markdown with syntax highlighting
- All markdown syntax visible at all times
- Traditional code editor experience
- Full control over markdown structure
- Syntax highlighting for code blocks

**Mode 3: Reading Mode**
- Pure formatted preview (no markdown syntax)
- Separate HTML rendered view
- Clean document reading experience
- Optional: Click to switch to Live Preview for editing
- Similar to Obsidian's Reading Mode

#### Mode Switching
Users can toggle between modes via:
- **Toolbar buttons** in editor
- **Keyboard shortcuts** (configurable)
- **Command palette** commands
- **Settings** for default mode preference

#### Editor Features
- ✅ **Headings** (H1-H6) with live rendering
- ✅ **Text formatting** (bold, italic, strikethrough)
- ✅ **Lists** (ordered, unordered, task lists)
- ✅ **Links** and images with inline preview
- ✅ **Code blocks** with syntax highlighting (100+ languages)
- ✅ **Tables** with formatted rendering
- ✅ **Blockquotes** with visual styling
- ✅ **Horizontal rules**
- ✅ **Live Preview** with cursor-based syntax revealing
- ✅ **GFM support** (GitHub Flavored Markdown)
- ✅ **Math equations** (KaTeX/MathJax optional)
- ✅ **Mermaid diagrams** (optional plugin)

---

## 3. Functional Requirements

### 3.1 Configuration System

#### Config File Structure
Each section is defined in a configuration file at workspace root:

**File**: `.vscode/markdown-extension-config.json`

```json
{
  "sections": [
    {
      "id": "specs",
      "label": "SPECS",
      "folderPath": "docs/specs",
      "description": "Build complex features with structured planning",
      "icon": "file-text"
    },
    {
      "id": "agents",
      "label": "AGENTS",
      "folderPath": "docs/agents",
      "description": "Automate repetitive tasks with smart triggers",
      "icon": "robot"
    },
    {
      "id": "commands",
      "label": "COMMANDS",
      "folderPath": "docs/commands",
      "description": "Custom workspace commands and scripts",
      "icon": "terminal"
    },
    {
      "id": "bolts",
      "label": "BOLTS",
      "folderPath": "docs/bolts",
      "description": "Quick actions and productivity boosters",
      "icon": "zap"
    }
  ],
  "filePattern": "**/*.md",
  "excludePatterns": ["**/node_modules/**", "**/.git/**"]
}
```

#### Config Behavior
- **Auto-discovery**: Extension scans configured folders on activation
- **Watch mode**: File system watcher for real-time updates
- **Validation**: Checks folder existence and accessibility
- **Defaults**: Provides sensible defaults if config missing

### 3.2 File Discovery & Display

#### Discovery Process
1. Read config file from `.vscode/markdown-extension-config.json`
2. For each section:
   - Resolve `folderPath` relative to workspace root
   - Scan for markdown files matching `filePattern`
   - Apply `excludePatterns` to filter results
3. Build tree structure for TreeView provider
4. Display in sidebar with collapsible sections

#### Sorting & Filtering
- **Alphabetical sorting** within each section (default)
- **Optional**: Modified date sorting
- **Optional**: Custom order via frontmatter metadata

#### File Metadata Display
- File name (without .md extension by default)
- Optional: Last modified indicator
- Optional: File size or word count

### 3.3 Custom Markdown Editor

#### Editor Implementation
**Technology**: CodeMirror 6 (Modular text editor framework)

**Integration Approach**:
1. Use VS Code **Custom Editor API** (`vscode.CustomTextEditor`)
2. Embed CodeMirror 6 in **WebviewPanel**
3. Message passing between extension and webview
4. Sync editor state with VS Code document
5. Use **Compartments** for dynamic mode switching

**CodeMirror 6 Architecture**:
- **@codemirror/state**: Editor state and transactions
- **@codemirror/view**: DOM view and rendering
- **@codemirror/lang-markdown**: Markdown language support
- **Custom ViewPlugins**: Live Preview decorations
- **StateFields**: Track cursor position and mode
- **Decorations API**: Hide/show markdown syntax

#### Editor Lifecycle
```
Double-click file
  ↓
Extension creates CustomTextEditor
  ↓
WebviewPanel initialized with CodeMirror 6
  ↓
Load file content from VS Code document
  ↓
Initialize in Live Preview mode (default)
  ↓
Render with cursor-based decorations
  ↓
User edits content
  ↓
User switches mode (optional)
  → Dispatch reconfigure transaction
  → Update decorations/view
  ↓
Sync changes back to VS Code document
  ↓
Auto-save or manual save (Cmd/Ctrl+S)
```

#### Save Behavior
- **Auto-save**: Sync editor changes to document in real-time
- **Manual save**: Respect VS Code's save settings
- **Dirty state**: Show unsaved indicator in tab
- **Conflict resolution**: Handle external file changes

#### Editor Customization
- **Theme support**: Match VS Code theme (light/dark)
- **Font settings**: Respect VS Code font preferences
- **Toolbar**: Configurable formatting toolbar
- **Keyboard shortcuts**: Standard markdown shortcuts

---

## 4. Technical Architecture

### 4.1 Extension Structure

```
vscode-markdown-extension/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── treeView/
│   │   ├── provider.ts           # TreeViewProvider for sidebar
│   │   ├── treeItem.ts           # TreeItem implementation
│   │   └── commands.ts           # Tree view commands (add, delete, etc.)
│   ├── editor/
│   │   ├── customEditor.ts       # CustomTextEditor implementation
│   │   ├── webview.ts            # Webview content provider
│   │   ├── sync.ts               # Document synchronization logic
│   │   └── modeManager.ts        # Editor mode state management
│   ├── config/
│   │   ├── schema.ts             # Config file schema/types
│   │   ├── loader.ts             # Config file loader
│   │   └── validator.ts          # Config validation
│   ├── fileSystem/
│   │   ├── watcher.ts            # File system watcher
│   │   └── scanner.ts            # Markdown file scanner
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── webview/
│   ├── src/
│   │   ├── index.ts              # Webview entry point
│   │   ├── editor.ts             # CodeMirror 6 editor setup
│   │   ├── livePreview.ts        # Live Preview mode implementation
│   │   ├── decorations.ts        # Decoration builders for syntax hiding
│   │   ├── reading.ts            # Reading mode (HTML renderer)
│   │   ├── modeSwitch.ts         # Mode switching logic
│   │   ├── theme.ts              # Theme management
│   │   └── messageHandler.ts    # Extension ↔ Webview messaging
│   ├── package.json
│   └── tsconfig.json
├── package.json
├── tsconfig.json
└── .vscodeignore
```

### 4.2 Core Components

#### Component 1: Tree View Provider
**Responsibility**: Display sidebar with sections and files

**Key Methods**:
- `getTreeItem(element)`: Returns tree item for display
- `getChildren(element)`: Returns children of section/file
- `refresh()`: Reload tree from file system

**Data Flow**:
```
Config Loader → File Scanner → Tree Item Builder → TreeView API
```

#### Component 2: Custom Text Editor
**Responsibility**: Open markdown files in Milkdown editor

**Key Methods**:
- `resolveCustomTextEditor()`: Initialize editor for document
- `updateWebview()`: Send document content to webview
- `syncDocument()`: Save webview changes to document

**Message Protocol**:
```typescript
// Extension → Webview
{
  type: 'init',
  content: string,  // Markdown content
  theme: 'light' | 'dark',
  mode: 'livePreview' | 'source' | 'reading'
}

// Webview → Extension
{
  type: 'change',
  content: string  // Updated markdown
}

// Extension → Webview
{
  type: 'themeChange',
  theme: 'light' | 'dark'
}

// Extension → Webview (Mode switch command)
{
  type: 'switchMode',
  mode: 'livePreview' | 'source' | 'reading'
}

// Webview → Extension (Mode changed notification)
{
  type: 'modeChanged',
  mode: 'livePreview' | 'source' | 'reading'
}
```

#### Component 3: Config Manager
**Responsibility**: Load and validate configuration

**Key Methods**:
- `loadConfig()`: Read config from workspace
- `validateConfig()`: Check schema and folder paths
- `watchConfig()`: Monitor config file changes
- `getDefaultConfig()`: Provide fallback configuration

#### Component 4: File System Manager
**Responsibility**: Scan folders and watch for changes

**Key Methods**:
- `scanFolder(path)`: Find markdown files in folder
- `watchFolder(path)`: Set up file system watcher
- `handleFileChange()`: React to file add/delete/modify

### 4.3 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Extension Host** | TypeScript | VS Code extension logic |
| **Webview** | TypeScript + HTML | Custom editor UI |
| **Editor Framework** | CodeMirror 6 | Modular text editor |
| **Markdown Parser** | @lezer/markdown | Markdown syntax tree parsing |
| **HTML Renderer** | marked.js or markdown-it | Reading mode HTML rendering |
| **Build Tool** | Webpack/esbuild | Bundle extension and webview |
| **Package Manager** | npm/yarn | Dependency management |

### 4.4 Dependencies

**Extension Dependencies**:
```json
{
  "vscode": "^1.80.0"
}
```

**Webview Dependencies**:
```json
{
  "@codemirror/state": "^6.x",
  "@codemirror/view": "^6.x",
  "@codemirror/lang-markdown": "^6.x",
  "@codemirror/commands": "^6.x",
  "@codemirror/autocomplete": "^6.x",
  "@codemirror/search": "^6.x",
  "@codemirror/lint": "^6.x",
  "@lezer/markdown": "^1.x",
  "@lezer/highlight": "^1.x",
  "marked": "^11.x",
  "dompurify": "^3.x"
}
```

**Optional Extensions** (for enhanced features):
```json
{
  "@codemirror/language-data": "^6.x",
  "katex": "^0.16.x",
  "mermaid": "^10.x"
}
```

---

## 5. User Stories & Use Cases

### 5.1 Primary User Stories

#### Story 1: Browse Documentation
**As a** developer
**I want to** see all my documentation organized by type in a sidebar
**So that** I can quickly navigate to the document I need

**Acceptance Criteria**:
- Sidebar shows all configured sections
- Each section displays markdown files from configured folder
- Files are sorted alphabetically
- Sections can be collapsed/expanded

#### Story 2: Edit Markdown Document with Live Preview
**As a** developer
**I want to** double-click a markdown file to edit it with Live Preview mode
**So that** I can see formatted content while easily accessing markdown syntax when needed

**Acceptance Criteria**:
- Double-click opens file in custom editor tab
- Editor opens in Live Preview mode by default
- Current line shows markdown syntax, other lines formatted
- Can switch between Live Preview, Source, and Reading modes
- Changes are saved to the file
- Editor respects VS Code theme

#### Story 3: Create New Document
**As a** developer
**I want to** create new markdown files directly from the sidebar
**So that** I can quickly add new documentation

**Acceptance Criteria**:
- Click [+] button on section header
- Prompts for file name
- Creates file in configured folder
- Opens new file in editor

#### Story 4: Organize Documentation
**As a** team lead
**I want to** configure custom sections for different documentation types
**So that** our team's documentation structure matches our workflow

**Acceptance Criteria**:
- Edit `.vscode/markdown-extension-config.json`
- Add/remove sections
- Configure folder paths per section
- Extension auto-refreshes on config change

### 5.2 Use Cases

#### Use Case 1: Onboarding New Project
1. Clone project repository
2. Open in VS Code
3. Extension detects config file
4. Sidebar populates with existing documentation
5. Developer browses specs, agents, commands

#### Use Case 2: Writing Specification
1. Click [+] on SPECS section
2. Enter filename: "user-authentication.md"
3. File created, opens in CodeMirror 6 editor (Live Preview mode)
4. Write specification - formatted text appears except current line
5. Switch to Source mode for fine-tuning markdown syntax
6. Switch to Reading mode to review final output
7. Save (Cmd/Ctrl+S)
8. File appears in SPECS section

#### Use Case 3: Updating Agent Definition
1. Navigate to AGENTS section in sidebar
2. Double-click "code-reviewer.md"
3. Edit agent parameters and prompts
4. Changes auto-sync to file
5. Close tab or continue editing

#### Use Case 4: Multi-Project Workspace
1. Open VS Code workspace with multiple folders
2. Each folder has own config file
3. Extension shows documentation from all folders
4. Section labels prefixed with folder name for clarity

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **Startup time**: Extension activation < 500ms
- **File scan**: Complete folder scan < 1s for 100 files
- **Editor load**: CodeMirror 6 editor ready < 300ms
- **Large files**: Support files up to 5MB without lag (CodeMirror 6 handles large docs well)
- **Mode switching**: < 100ms to switch between modes
- **Decoration updates**: Real-time cursor-based syntax revealing with no perceptible lag

### 6.2 Reliability
- **Error handling**: Graceful degradation if config invalid
- **File conflicts**: Detect and warn about external changes
- **State recovery**: Restore open editors after VS Code restart
- **Validation**: Validate config schema on load

### 6.3 Usability
- **Intuitive UI**: Sidebar follows VS Code conventions
- **Keyboard navigation**: Support arrow keys, Enter, etc.
- **Accessibility**: Screen reader compatible
- **Documentation**: Clear README with setup instructions

### 6.4 Compatibility
- **VS Code versions**: Support 1.80.0 and above
- **OS**: Windows, macOS, Linux
- **Workspace types**: Single folder and multi-root workspaces
- **Remote**: Compatible with Remote - SSH, Containers, WSL

### 6.5 Security
- **File access**: Respect VS Code workspace trust
- **Webview**: Use Content Security Policy (CSP)
- **Sanitization**: Sanitize markdown content in webview
- **Permissions**: Request minimal necessary permissions

---

## 7. Milestones & Phased Delivery

### Phase 1: MVP (Minimum Viable Product)
**Timeline**: 3-4 weeks
**Scope**:
- ✅ Basic tree view with hardcoded sections
- ✅ File discovery in configured folders
- ✅ Custom editor with CodeMirror 6 integration
- ✅ **Live Preview mode** with cursor-based syntax revealing
- ✅ **Source mode** (plain markdown editing)
- ✅ Mode switching between Live Preview and Source
- ✅ Double-click to open files
- ✅ Basic save functionality
- ✅ Simple default config
- ✅ Theme synchronization (light/dark)

**Deliverables**:
- Working extension installable via VSIX
- Support for single workspace folder
- Live Preview and Source modes functional
- Basic mode switching
- Obsidian-like editing experience

### Phase 2: Configuration & Reading Mode
**Timeline**: 2-3 weeks
**Scope**:
- ✅ Config file support (`.vscode/markdown-extension-config.json`)
- ✅ Dynamic section loading from config
- ✅ File system watcher for auto-refresh
- ✅ Create new file functionality ([+] button)
- ✅ **Reading mode** (HTML rendered preview)
- ✅ Three-way mode switching (Live Preview ↔ Source ↔ Reading)
- ✅ Toolbar for mode switching
- ✅ Keyboard shortcuts for modes
- ✅ Error handling and validation

**Deliverables**:
- Config-driven architecture
- All three modes fully functional
- Auto-refresh on file/config changes
- Complete Obsidian-like feature parity
- Better UX and error messages

### Phase 3: Enhanced Features
**Timeline**: 2-3 weeks
**Scope**:
- ✅ Context menus (right-click on files/sections)
- ✅ File operations (rename, delete, move)
- ✅ Search/filter within sections
- ✅ Multi-root workspace support
- ✅ Settings UI for extension preferences
- ✅ Markdown frontmatter support

**Deliverables**:
- Feature-complete extension
- Production-ready quality
- Marketplace publication

### Phase 4: Advanced Features (Post-MVP)
**Timeline**: TBD
**Scope**:
- ⏳ Split view (Live Preview + Source side-by-side)
- ⏳ Custom CodeMirror extensions (math, diagrams)
- ⏳ Template system for new files
- ⏳ Export to HTML/PDF
- ⏳ Collaborative editing / comments
- ⏳ Git integration (show file status, inline diffs)
- ⏳ Backlinks and graph view (Obsidian-style)
- ⏳ Tags and metadata indexing
- ⏳ Full-text search across all documents
- ⏳ Custom themes for editor

---

## 8. Open Questions & Decisions

### 8.1 Decided

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Editor library** | **CodeMirror 6** | Supports Live Preview, same as Obsidian, full control over modes |
| **Live Preview support** | **Yes, in Phase 1** | Core requirement for Obsidian-like experience |
| **Three editing modes** | **Live Preview, Source, Reading** | Match Obsidian functionality |
| **Config location** | `.vscode/markdown-extension-config.json` | VS Code convention, workspace-specific |
| **Custom editor vs webview** | Custom Text Editor API | Better integration with VS Code document model |
| **Initial sections** | specs, agents, commands, bolts | Based on user requirements |
| **HTML renderer for Reading mode** | marked.js or markdown-it | Lightweight, well-maintained, GFM support |

### 8.2 Open Questions

| Question | Options | Impact | Priority |
|----------|---------|--------|----------|
| **Math rendering library?** | 1. KaTeX<br>2. MathJax<br>3. None (Phase 4) | Math equation support | Low |
| **Diagram library?** | 1. Mermaid<br>2. PlantUML<br>3. None (Phase 4) | Diagram support | Low |
| **File templates?** | 1. Support templates<br>2. Always create blank files | UX for new files | Medium |
| **Multi-folder strategy?** | 1. Merge all into one tree<br>2. Separate trees per folder | Multi-root workspace UX | Medium |
| **Marketplace name?** | TBD | Discoverability | High |
| **Icon design?** | TBD | Branding | Low |
| **Collaborative comments?** | 1. Integrate OSS commenting library<br>2. Build custom<br>3. Phase 4 | Collaboration features | Medium |

### 8.3 Technical Risks

| Risk | Mitigation | Priority |
|------|------------|----------|
| **CodeMirror 6 Live Preview complexity** | Reference Obsidian patterns, study codemirror-rich-markdoc plugin | High |
| **Decoration performance with large files** | Use efficient decorations, optimize cursor tracking | Medium |
| **Large file performance** | CodeMirror 6 handles this well, test with 5MB+ files | Low |
| **Webview security** | Strict CSP, sanitize all content with DOMPurify | High |
| **Mode switching state management** | Use Compartments properly, test all transitions | Medium |
| **Config schema changes** | Version config file, migration logic | Low |
| **Theme sync complexity** | Use VS Code theme API, test extensively | Medium |
| **Reading mode HTML rendering** | Sanitize with DOMPurify, use secure CSP | High |

---

## 9. Success Metrics

### 9.1 Adoption Metrics
- **Installations**: Target 1,000+ in first 3 months
- **Active users**: 50%+ weekly active rate
- **Rating**: Maintain 4.0+ stars on Marketplace

### 9.2 Usage Metrics
- **Files opened**: Average 10+ files per user per week
- **Edit sessions**: Average 5+ sessions per user per week
- **Sections configured**: Average 3+ sections per workspace

### 9.3 Quality Metrics
- **Crash rate**: < 0.1% of sessions
- **Error rate**: < 1% of operations
- **Load time**: 95% of loads < 500ms

---

## 10. References & Resources

### 10.1 Documentation
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Custom Editor API Guide](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [TreeView API](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [CodeMirror 6 Examples](https://codemirror.net/examples/)
- [CodeMirror 6 Migration Guide](https://codemirror.net/docs/migration/)
- [@codemirror/lang-markdown](https://github.com/codemirror/lang-markdown)
- [Lezer Markdown Parser](https://github.com/lezer-parser/markdown)

### 10.2 Example Extensions & References
- [Obsidian (CodeMirror 6 user)](https://obsidian.md/)
- [codemirror-rich-markdoc](https://github.com/segphault/codemirror-rich-markdoc) - Live Preview reference
- [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)
- [Foam](https://marketplace.visualstudio.com/items?itemName=foam.foam-vscode)
- [CodeMirror 6 Quickstart](https://github.com/RPGillespie6/codemirror-quickstart)

### 10.3 Related Research
- See `specs/research/markdown_editor_research.md` for detailed editor library analysis

---

## Appendix A: Example Config File

```json
{
  "version": "1.0",
  "sections": [
    {
      "id": "specs",
      "label": "SPECS",
      "folderPath": "docs/specs",
      "description": "Build complex features with structured planning",
      "icon": "file-text",
      "sortBy": "alphabetical",
      "template": "templates/spec-template.md"
    },
    {
      "id": "agents",
      "label": "AGENTS",
      "folderPath": "docs/agents",
      "description": "Automate repetitive tasks with smart triggers",
      "icon": "robot",
      "sortBy": "alphabetical"
    },
    {
      "id": "commands",
      "label": "COMMANDS",
      "folderPath": "docs/commands",
      "description": "Custom workspace commands and scripts",
      "icon": "terminal",
      "sortBy": "modified"
    },
    {
      "id": "bolts",
      "label": "BOLTS",
      "folderPath": "docs/bolts",
      "description": "Quick actions and productivity boosters",
      "icon": "zap",
      "sortBy": "alphabetical"
    }
  ],
  "filePattern": "**/*.md",
  "excludePatterns": [
    "**/node_modules/**",
    "**/.git/**",
    "**/README.md"
  ],
  "editor": {
    "defaultMode": "livePreview",
    "autoSave": true,
    "theme": "auto",
    "toolbar": true,
    "syntaxHighlight": true,
    "lineNumbers": false
  }
}
```

---

## Appendix B: VS Code Commands

### Extension Commands

| Command | ID | Description |
|---------|-----|-------------|
| **Refresh Sections** | `markdown-ext.refresh` | Reload all sections from file system |
| **Open Config** | `markdown-ext.openConfig` | Open config file in editor |
| **Create File** | `markdown-ext.createFile` | Create new markdown file in section |
| **Delete File** | `markdown-ext.deleteFile` | Delete selected file |
| **Rename File** | `markdown-ext.renameFile` | Rename selected file |
| **Switch to Live Preview** | `markdown-ext.switchToLivePreview` | Switch active editor to Live Preview mode |
| **Switch to Source** | `markdown-ext.switchToSource` | Switch active editor to Source mode |
| **Switch to Reading** | `markdown-ext.switchToReading` | Switch active editor to Reading mode |
| **Toggle Mode** | `markdown-ext.toggleMode` | Cycle through modes (Live Preview → Source → Reading) |

---

## Appendix C: Extension Settings

### Contribution to VS Code Settings

```json
{
  "markdownExtension.configPath": {
    "type": "string",
    "default": ".vscode/markdown-extension-config.json",
    "description": "Path to extension config file relative to workspace"
  },
  "markdownExtension.autoRefresh": {
    "type": "boolean",
    "default": true,
    "description": "Automatically refresh tree view on file changes"
  },
  "markdownExtension.editor.defaultMode": {
    "type": "string",
    "enum": ["livePreview", "source", "reading"],
    "default": "livePreview",
    "description": "Default editing mode when opening markdown files"
  },
  "markdownExtension.editor.toolbar": {
    "type": "boolean",
    "default": true,
    "description": "Show formatting toolbar and mode switcher in editor"
  },
  "markdownExtension.editor.autoSave": {
    "type": "boolean",
    "default": true,
    "description": "Auto-save changes to document"
  },
  "markdownExtension.editor.theme": {
    "type": "string",
    "enum": ["auto", "light", "dark"],
    "default": "auto",
    "description": "Editor theme (auto syncs with VS Code theme)"
  },
  "markdownExtension.editor.syntaxHighlight": {
    "type": "boolean",
    "default": true,
    "description": "Enable syntax highlighting in code blocks"
  },
  "markdownExtension.editor.lineNumbers": {
    "type": "boolean",
    "default": false,
    "description": "Show line numbers in Source mode"
  },
  "markdownExtension.keybindings.toggleMode": {
    "type": "string",
    "default": "Ctrl+Shift+M",
    "description": "Keyboard shortcut to toggle between modes"
  }
}
```

---

**End of PRD**

**Next Steps**:
1. Review and approve this PRD
2. Set up development environment
3. Initialize extension project structure
4. Begin Phase 1 implementation
5. Create proof-of-concept for tree view and basic editor
