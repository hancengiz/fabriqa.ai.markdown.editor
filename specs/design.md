# Design Document
## VS Code Markdown Documentation Extension

**Version**: 1.0
**Last Updated**: November 19, 2025
**Status**: Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Component Design](#3-component-design)
4. [Data Models](#4-data-models)
5. [Communication Patterns](#5-communication-patterns)
6. [Editor Implementation](#6-editor-implementation)
7. [File System Integration](#7-file-system-integration)
8. [Configuration Management](#8-configuration-management)
9. [Security Considerations](#9-security-considerations)
10. [Performance Optimizations](#10-performance-optimizations)
11. [Testing Strategy](#11-testing-strategy)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Overview

### 1.1 Design Goals

**Primary Goals**:
- ✅ Provide Obsidian-like markdown editing experience in VS Code
- ✅ Support three editing modes (Live Preview, Source, Reading)
- ✅ Config-driven file organization with custom sidebar
- ✅ Seamless integration with VS Code ecosystem

**Non-Goals**:
- ❌ Replace VS Code's built-in markdown preview
- ❌ Sync with external markdown systems (Obsidian, Notion, etc.)
- ❌ Support non-markdown file types

### 1.2 Design Principles

1. **Separation of Concerns**: Clear boundaries between extension host and webview
2. **Progressive Enhancement**: Start simple, add features incrementally
3. **Performance First**: Lazy loading, virtual rendering, efficient updates
4. **VS Code Native**: Follow VS Code conventions and patterns
5. **Extensibility**: Plugin-like architecture for future features

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VS Code Window                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │   Activity Bar   │  │      Editor Area                   │  │
│  │  ┌────────────┐  │  │  ┌──────────────────────────────┐ │  │
│  │  │            │  │  │  │  CodeMirror 6 Webview        │ │  │
│  │  │   Icon     │  │  │  │  ┌────────────────────────┐  │ │  │
│  │  │            │  │  │  │  │  Toolbar               │  │ │  │
│  │  └────────────┘  │  │  │  │  [LP] [SRC] [RD] [💬] │  │ │  │
│  │                  │  │  │  └────────────────────────┘  │ │  │
│  └──────────────────┘  │  │  ┌────────────────────────┐  │ │  │
│                        │  │  │  Editor Content        │  │ │  │
│  ┌──────────────────┐  │  │  │  • Live Preview mode  │  │ │  │
│  │   Sidebar View   │  │  │  │  • Source mode        │  │ │  │
│  │  ┌────────────┐  │  │  │  │  • Reading mode       │  │ │  │
│  │  │▼ SPECS     │  │  │  │  └────────────────────────┘  │ │  │
│  │  │  📄 file1  │  │  │  └──────────────────────────────┘ │  │
│  │  │  📄 file2  │  │  │                                    │  │
│  │  │▼ AGENTS    │  │  │                                    │  │
│  │  │  📄 file3  │  │  │                                    │  │
│  │  │▼ COMMANDS  │  │  │                                    │  │
│  │  │  📄 file4  │  │  │                                    │  │
│  │  │▼ BOLTS     │  │  │                                    │  │
│  │  │  📄 file5  │  │  │                                    │  │
│  │  └────────────┘  │  │                                    │  │
│  └──────────────────┘  └────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Extension Host (Node.js)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Extension Entry Point (extension.ts)                    │  │
│  │  • Activation                                            │  │
│  │  • Command Registration                                  │  │
│  │  • Extension Context Management                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐       │
│  │  TreeView   │  │  Custom Editor  │  │   Config     │       │
│  │  Provider   │  │  Provider       │  │   Manager    │       │
│  └─────────────┘  └─────────────────┘  └──────────────┘       │
│         │                  │                  │                 │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐       │
│  │   File      │  │   Webview       │  │   File       │       │
│  │   Scanner   │  │   Manager       │  │   Watcher    │       │
│  └─────────────┘  └─────────────────┘  └──────────────┘       │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                   Message Passing (postMessage)
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                      Webview (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Webview Entry Point (index.ts)                          │  │
│  │  • Initialize CodeMirror 6                               │  │
│  │  • Handle Messages                                       │  │
│  │  • Manage Editor State                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐       │
│  │  CodeMirror │  │   Mode          │  │   Theme      │       │
│  │  Editor     │  │   Manager       │  │   Manager    │       │
│  └─────────────┘  └─────────────────┘  └──────────────┘       │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐       │
│  │  Live       │  │   Source        │  │   Reading    │       │
│  │  Preview    │  │   Mode          │  │   Mode       │       │
│  │  Mode       │  │                 │  │   (HTML)     │       │
│  └─────────────┘  └─────────────────┘  └──────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Extension Host** | TypeScript | 5.x | Type-safe extension development |
| **Runtime** | Node.js | 18.x+ | Extension execution environment |
| **VS Code API** | vscode | 1.80.0+ | Extension APIs |
| **Webview** | TypeScript | 5.x | Webview logic |
| **Editor** | CodeMirror 6 | 6.x | Markdown editing |
| **Markdown Parser** | @lezer/markdown | 1.x | Syntax tree parsing |
| **HTML Renderer** | marked | 11.x | Reading mode rendering |
| **Sanitization** | dompurify | 3.x | XSS protection |
| **Build Tool** | esbuild | 0.19.x | Fast bundling |

---

## 3. Component Design

### 3.1 Extension Host Components

#### 3.1.1 Extension Entry Point

**File**: `src/extension.ts`

**Responsibilities**:
- Extension activation/deactivation
- Register commands
- Initialize providers
- Setup configuration watchers

**Interface**:
```typescript
export function activate(context: vscode.ExtensionContext): void {
  // 1. Load configuration
  const config = ConfigManager.load();

  // 2. Register TreeView provider
  const treeProvider = new MarkdownTreeProvider(config);
  vscode.window.registerTreeDataProvider('markdownDocs', treeProvider);

  // 3. Register Custom Editor
  const editorProvider = new MarkdownEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'markdownEditor.editor',
      editorProvider
    )
  );

  // 4. Register commands
  registerCommands(context, treeProvider, editorProvider);

  // 5. Setup file watchers
  setupFileWatchers(context, treeProvider);
}

export function deactivate(): void {
  // Cleanup resources
}
```

---

#### 3.1.2 TreeView Provider

**File**: `src/treeView/provider.ts`

**Responsibilities**:
- Provide tree structure for sidebar
- Handle file discovery
- React to file system changes
- Manage section collapse/expand state

**Class Diagram**:
```typescript
class MarkdownTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined>;
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined>;

  constructor(private config: ExtensionConfig) {}

  // TreeDataProvider interface
  getTreeItem(element: TreeItem): vscode.TreeItem;
  getChildren(element?: TreeItem): Thenable<TreeItem[]>;

  // Custom methods
  refresh(): void;
  revealFile(filePath: string): void;
}

class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly type: 'section' | 'file',
    public readonly label: string,
    public readonly resourceUri?: vscode.Uri,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}
```

**Data Flow**:
```
Config Load → File Scanner → Tree Items → TreeView Display
                    ↓
            File Watcher Updates
                    ↓
            Refresh Event → Update UI
```

---

#### 3.1.3 Custom Editor Provider

**File**: `src/editor/customEditor.ts`

**Responsibilities**:
- Implement `vscode.CustomTextEditorProvider`
- Manage webview lifecycle
- Sync document changes
- Handle save operations

**Class Diagram**:
```typescript
class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  private readonly webviews = new WebviewCollection();

  constructor(private readonly context: vscode.ExtensionContext) {}

  // CustomTextEditorProvider interface
  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // 1. Setup webview options
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    // 2. Set webview HTML
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // 3. Setup message handling
    this.setupMessageHandling(document, webviewPanel);

    // 4. Send initial content
    this.updateWebview(document, webviewPanel);
  }

  private setupMessageHandling(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel
  ): void {
    panel.webview.onDidReceiveMessage(message => {
      switch (message.type) {
        case 'change':
          this.updateDocument(document, message.content);
          break;
        case 'modeChanged':
          // Handle mode change notification
          break;
      }
    });

    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.updateWebview(document, panel);
      }
    });
  }

  private updateDocument(
    document: vscode.TextDocument,
    content: string
  ): void {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      content
    );
    vscode.workspace.applyEdit(edit);
  }
}
```

---

#### 3.1.4 Config Manager

**File**: `src/config/loader.ts`

**Responsibilities**:
- Load configuration from `.vscode/markdown-extension-config.json`
- Validate configuration schema
- Provide default configuration
- Watch for config changes

**Interface**:
```typescript
interface ExtensionConfig {
  version: string;
  sections: Section[];
  filePattern: string;
  excludePatterns: string[];
  editor: EditorConfig;
}

interface Section {
  id: string;
  label: string;
  folderPath: string;
  description?: string;
  icon?: string;
  sortBy?: 'alphabetical' | 'modified';
  template?: string;
}

interface EditorConfig {
  defaultMode: 'livePreview' | 'source' | 'reading';
  autoSave: boolean;
  theme: 'auto' | 'light' | 'dark';
  toolbar: boolean;
  syntaxHighlight: boolean;
  lineNumbers: boolean;
}

class ConfigManager {
  static async load(
    workspaceRoot: string
  ): Promise<ExtensionConfig> {
    const configPath = path.join(
      workspaceRoot,
      '.vscode',
      'markdown-extension-config.json'
    );

    if (await fs.pathExists(configPath)) {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return this.validate(config);
    }

    return this.getDefaultConfig();
  }

  static validate(config: any): ExtensionConfig {
    // JSON Schema validation
    // Throw error if invalid
    return config;
  }

  static getDefaultConfig(): ExtensionConfig {
    return {
      version: '1.0',
      sections: [
        {
          id: 'specs',
          label: 'SPECS',
          folderPath: 'docs/specs',
          icon: 'file-text'
        },
        // ... other sections
      ],
      filePattern: '**/*.md',
      excludePatterns: ['**/node_modules/**'],
      editor: {
        defaultMode: 'livePreview',
        autoSave: true,
        theme: 'auto',
        toolbar: true,
        syntaxHighlight: true,
        lineNumbers: false
      }
    };
  }
}
```

---

#### 3.1.5 File System Manager

**File**: `src/fileSystem/scanner.ts` & `watcher.ts`

**Responsibilities**:
- Scan folders for markdown files
- Watch for file changes
- Handle file operations (create, delete, rename)

**Scanner Interface**:
```typescript
class FileScanner {
  async scanFolder(
    folderPath: string,
    pattern: string,
    excludePatterns: string[]
  ): Promise<string[]> {
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folderPath, pattern),
      this.buildExcludePattern(excludePatterns)
    );

    return files.map(uri => uri.fsPath);
  }

  private buildExcludePattern(patterns: string[]): string {
    return `{${patterns.join(',')}}`;
  }
}
```

**Watcher Interface**:
```typescript
class FileWatcher {
  private watchers: vscode.FileSystemWatcher[] = [];

  watch(
    pattern: string,
    onChange: (uri: vscode.Uri) => void
  ): vscode.Disposable {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidCreate(onChange);
    watcher.onDidChange(onChange);
    watcher.onDidDelete(onChange);

    this.watchers.push(watcher);

    return {
      dispose: () => {
        watcher.dispose();
        this.watchers = this.watchers.filter(w => w !== watcher);
      }
    };
  }

  dispose(): void {
    this.watchers.forEach(w => w.dispose());
  }
}
```

---

### 3.2 Webview Components

#### 3.2.1 Webview Entry Point

**File**: `webview/src/index.ts`

**Responsibilities**:
- Initialize CodeMirror 6
- Setup message handlers
- Manage editor state
- Handle mode switching

**Structure**:
```typescript
// Global state
let editor: EditorView;
let currentMode: 'livePreview' | 'source' | 'reading' = 'livePreview';
const vscode = acquireVsCodeApi();

// Initialize
function init() {
  const container = document.getElementById('editor');

  // Create CodeMirror editor
  editor = new EditorView({
    parent: container,
    extensions: getExtensionsForMode('livePreview')
  });

  // Setup message handling
  window.addEventListener('message', handleMessage);

  // Setup UI
  setupToolbar();
}

// Message handling
function handleMessage(event: MessageEvent) {
  const message = event.data;

  switch (message.type) {
    case 'init':
      updateContent(message.content);
      switchMode(message.mode);
      applyTheme(message.theme);
      break;

    case 'switchMode':
      switchMode(message.mode);
      break;

    case 'themeChange':
      applyTheme(message.theme);
      break;
  }
}

// Update editor content
function updateContent(content: string) {
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: content
    }
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
```

---

#### 3.2.2 Mode Manager

**File**: `webview/src/modeSwitch.ts`

**Responsibilities**:
- Switch between editing modes
- Reconfigure CodeMirror extensions
- Toggle reading mode view

**Interface**:
```typescript
class ModeManager {
  private currentMode: EditorMode = 'livePreview';
  private modeCompartment: Compartment;

  constructor(private editor: EditorView) {
    this.modeCompartment = new Compartment();
  }

  switchTo(mode: EditorMode): void {
    if (mode === this.currentMode) return;

    switch (mode) {
      case 'livePreview':
        this.switchToLivePreview();
        break;
      case 'source':
        this.switchToSource();
        break;
      case 'reading':
        this.switchToReading();
        break;
    }

    this.currentMode = mode;
    notifyModeChange(mode);
  }

  private switchToLivePreview(): void {
    // Show CodeMirror, hide reading view
    document.getElementById('editor').style.display = 'block';
    document.getElementById('reading').style.display = 'none';

    // Reconfigure with Live Preview extensions
    this.editor.dispatch({
      effects: this.modeCompartment.reconfigure(
        livePreviewExtensions()
      )
    });
  }

  private switchToSource(): void {
    // Show CodeMirror, hide reading view
    document.getElementById('editor').style.display = 'block';
    document.getElementById('reading').style.display = 'none';

    // Reconfigure with Source extensions
    this.editor.dispatch({
      effects: this.modeCompartment.reconfigure(
        sourceExtensions()
      )
    });
  }

  private switchToReading(): void {
    // Hide CodeMirror, show reading view
    document.getElementById('editor').style.display = 'none';
    document.getElementById('reading').style.display = 'block';

    // Render markdown to HTML
    renderReadingMode(this.editor.state.doc.toString());
  }
}
```

---

#### 3.2.3 Live Preview Implementation

**File**: `webview/src/livePreview.ts`

**Responsibilities**:
- Implement cursor-based syntax revealing
- Manage decorations
- Track cursor position

**Implementation**:
```typescript
import { ViewPlugin, Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

// Live Preview ViewPlugin
export const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const cursorPos = view.state.selection.main.head;
      const cursorLine = view.state.doc.lineAt(cursorPos);

      // Iterate through syntax tree
      syntaxTree(view.state).iterate({
        from: 0,
        to: view.state.doc.length,
        enter: (node) => {
          // Skip if cursor is on this node's line
          if (this.isOnCursorLine(node, cursorLine)) {
            return;
          }

          // Hide markdown syntax based on node type
          switch (node.name) {
            case 'StrongEmphasis':
              this.hideEmphasisMarks(node, builder, view);
              break;
            case 'Emphasis':
              this.hideEmphasisMarks(node, builder, view);
              break;
            case 'Link':
              this.hideLinkSyntax(node, builder, view);
              break;
            case 'ATXHeading':
              this.hideHeadingMarks(node, builder, view);
              break;
          }
        }
      });

      return builder.finish();
    }

    private isOnCursorLine(node: SyntaxNode, cursorLine: Line): boolean {
      const nodeStart = node.from;
      const nodeEnd = node.to;
      return nodeStart >= cursorLine.from && nodeEnd <= cursorLine.to;
    }

    private hideEmphasisMarks(
      node: SyntaxNode,
      builder: RangeSetBuilder<Decoration>,
      view: EditorView
    ): void {
      // Hide ** or __ or * or _
      const text = view.state.doc.sliceString(node.from, node.to);

      if (text.startsWith('**') || text.startsWith('__')) {
        // Hide opening marks
        builder.add(
          node.from,
          node.from + 2,
          Decoration.mark({ class: 'cm-md-hidden' })
        );
        // Hide closing marks
        builder.add(
          node.to - 2,
          node.to,
          Decoration.mark({ class: 'cm-md-hidden' })
        );
      } else if (text.startsWith('*') || text.startsWith('_')) {
        builder.add(
          node.from,
          node.from + 1,
          Decoration.mark({ class: 'cm-md-hidden' })
        );
        builder.add(
          node.to - 1,
          node.to,
          Decoration.mark({ class: 'cm-md-hidden' })
        );
      }
    }
  },
  {
    decorations: v => v.decorations
  }
);

// CSS for hiding syntax
const livePreviewTheme = EditorView.theme({
  '.cm-md-hidden': {
    fontSize: '1px',
    letterSpacing: '-1ch',
    color: 'transparent'
  }
});

// Export Live Preview extensions
export function livePreviewExtensions() {
  return [
    markdown(),
    livePreviewPlugin,
    livePreviewTheme
  ];
}
```

---

#### 3.2.4 Reading Mode Renderer

**File**: `webview/src/reading.ts`

**Responsibilities**:
- Render markdown to HTML
- Sanitize output
- Apply styles

**Implementation**:
```typescript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderReadingMode(markdown: string): void {
  const readingContainer = document.getElementById('reading');

  // Configure marked
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false
  });

  // Render markdown to HTML
  const rawHtml = marked.parse(markdown);

  // Sanitize HTML
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'code', 'pre',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'input' // For task lists
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'type', 'checked', 'disabled' // For task lists
    ]
  });

  // Update container
  readingContainer.innerHTML = cleanHtml;

  // Add click handler to switch to Live Preview
  readingContainer.addEventListener('click', (e) => {
    if (e.target instanceof HTMLElement && e.target.matches('p, h1, h2, h3, h4, h5, h6, li')) {
      // Optional: Switch to Live Preview when clicking text
      // vscode.postMessage({ type: 'switchMode', mode: 'livePreview' });
    }
  });
}
```

---

## 4. Data Models

### 4.1 Configuration Schema

**File**: `src/config/schema.ts`

```typescript
export interface ExtensionConfig {
  version: string;
  sections: Section[];
  filePattern: string;
  excludePatterns: string[];
  editor: EditorConfig;
}

export interface Section {
  id: string;                    // Unique identifier
  label: string;                 // Display label
  folderPath: string;            // Relative to workspace root
  description?: string;          // Tooltip description
  icon?: string;                 // VS Code icon name
  sortBy?: 'alphabetical' | 'modified';
  template?: string;             // Path to template file
}

export interface EditorConfig {
  defaultMode: 'livePreview' | 'source' | 'reading';
  autoSave: boolean;
  theme: 'auto' | 'light' | 'dark';
  toolbar: boolean;
  syntaxHighlight: boolean;
  lineNumbers: boolean;
}
```

### 4.2 Message Protocol

**File**: `src/types/messages.ts`

```typescript
// Extension → Webview Messages
export type ExtensionMessage =
  | { type: 'init'; content: string; mode: EditorMode; theme: Theme }
  | { type: 'switchMode'; mode: EditorMode }
  | { type: 'themeChange'; theme: Theme }
  | { type: 'updateContent'; content: string };

// Webview → Extension Messages
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'change'; content: string }
  | { type: 'modeChanged'; mode: EditorMode }
  | { type: 'error'; error: string };

export type EditorMode = 'livePreview' | 'source' | 'reading';
export type Theme = 'light' | 'dark';
```

### 4.3 Tree Item Model

**File**: `src/treeView/treeItem.ts`

```typescript
export class MarkdownTreeItem extends vscode.TreeItem {
  constructor(
    public readonly type: 'section' | 'file',
    public readonly label: string,
    public readonly sectionId?: string,
    public readonly resourceUri?: vscode.Uri,
    public readonly description?: string,
    collapsibleState?: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    if (type === 'section') {
      this.contextValue = 'section';
      this.iconPath = new vscode.ThemeIcon('folder');
    } else {
      this.contextValue = 'file';
      this.iconPath = new vscode.ThemeIcon('markdown');
      this.command = {
        command: 'markdownDocs.openFile',
        title: 'Open File',
        arguments: [resourceUri]
      };
    }
  }
}
```

---

## 5. Communication Patterns

### 5.1 Extension ↔ Webview Communication

**Message Flow**:
```
Extension Host                    Webview
      │                              │
      │──── init (content, mode) ────│
      │                              │
      │                              │ User edits
      │                              │
      │◄──── change (content) ───────│
      │                              │
      │ Apply edit to document       │
      │                              │
      │──── updateContent ───────────│
      │                              │
      │                              │ User switches mode
      │                              │
      │◄──── modeChanged ────────────│
      │                              │
```

### 5.2 Document Synchronization

**Two-Way Sync Strategy**:

1. **Webview → Document**:
   ```typescript
   // In webview
   editor.dom.addEventListener('input', debounce(() => {
     vscode.postMessage({
       type: 'change',
       content: editor.state.doc.toString()
     });
   }, 300));
   ```

2. **Document → Webview**:
   ```typescript
   // In extension
   vscode.workspace.onDidChangeTextDocument(e => {
     if (e.document === currentDocument) {
       panel.webview.postMessage({
         type: 'updateContent',
         content: e.document.getText()
       });
     }
   });
   ```

3. **Conflict Resolution**:
   - Use document version tracking
   - Ignore self-initiated changes
   - Show warning on external changes during editing

---

## 6. Editor Implementation

### 6.1 CodeMirror 6 Setup

**Base Extensions**:
```typescript
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

export function createEditor(container: HTMLElement): EditorView {
  return new EditorView({
    parent: container,
    state: EditorState.create({
      extensions: [
        // Basic setup
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        syntaxHighlighting(defaultHighlightStyle),

        // Markdown support
        markdown(),

        // Mode-specific (will be compartmentalized)
        livePreviewExtensions(),

        // Update listener
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            notifyContentChange(update.state.doc.toString());
          }
        })
      ]
    })
  });
}
```

### 6.2 Extension Compartments

**Dynamic Reconfiguration**:
```typescript
import { Compartment } from '@codemirror/state';

const modeCompartment = new Compartment();
const themeCompartment = new Compartment();

// Initial state
const state = EditorState.create({
  extensions: [
    modeCompartment.of(livePreviewExtensions()),
    themeCompartment.of(lightTheme)
  ]
});

// Switch mode
function switchMode(editor: EditorView, mode: EditorMode) {
  editor.dispatch({
    effects: modeCompartment.reconfigure(
      mode === 'livePreview' ? livePreviewExtensions() :
      mode === 'source' ? sourceExtensions() :
      []
    )
  });
}

// Switch theme
function switchTheme(editor: EditorView, theme: Theme) {
  editor.dispatch({
    effects: themeCompartment.reconfigure(
      theme === 'light' ? lightTheme : darkTheme
    )
  });
}
```

---

## 7. File System Integration

### 7.1 File Discovery Strategy

**Scan Process**:
```typescript
async function discoverFiles(section: Section): Promise<vscode.Uri[]> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceRoot) return [];

  const folderPath = path.join(workspaceRoot, section.folderPath);

  // Use VS Code's glob search
  const files = await vscode.workspace.findFiles(
    new vscode.RelativePattern(folderPath, '**/*.md'),
    '**/node_modules/**'
  );

  // Sort according to section config
  return sortFiles(files, section.sortBy || 'alphabetical');
}

function sortFiles(files: vscode.Uri[], sortBy: string): vscode.Uri[] {
  if (sortBy === 'modified') {
    return files.sort((a, b) => {
      const statA = fs.statSync(a.fsPath);
      const statB = fs.statSync(b.fsPath);
      return statB.mtimeMs - statA.mtimeMs;
    });
  }

  // Alphabetical (default)
  return files.sort((a, b) => {
    return path.basename(a.fsPath).localeCompare(path.basename(b.fsPath));
  });
}
```

### 7.2 File Watching

**Watch Strategy**:
```typescript
function setupWatchers(
  sections: Section[],
  onFileChange: () => void
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  for (const section of sections) {
    const pattern = new vscode.RelativePattern(
      section.folderPath,
      '**/*.md'
    );

    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidCreate(onFileChange);
    watcher.onDidChange(onFileChange);
    watcher.onDidDelete(onFileChange);

    disposables.push(watcher);
  }

  return disposables;
}
```

---

## 8. Configuration Management

### 8.1 Configuration Loading

**Load Sequence**:
```
1. Extension activates
   ↓
2. Check for .vscode/markdown-extension-config.json
   ↓
3. If exists: Load and validate
   If not: Use default config
   ↓
4. Watch config file for changes
   ↓
5. On change: Reload and refresh TreeView
```

### 8.2 Configuration Validation

**JSON Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["sections"],
  "properties": {
    "version": { "type": "string" },
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "folderPath"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "folderPath": { "type": "string" },
          "description": { "type": "string" },
          "icon": { "type": "string" },
          "sortBy": { "enum": ["alphabetical", "modified"] }
        }
      }
    },
    "filePattern": { "type": "string", "default": "**/*.md" },
    "excludePatterns": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

---

## 9. Security Considerations

### 9.1 Content Security Policy

**Webview CSP**:
```html
<meta http-equiv="Content-Security-Policy"
      content="
        default-src 'none';
        script-src ${webview.cspSource} 'unsafe-inline';
        style-src ${webview.cspSource} 'unsafe-inline';
        font-src ${webview.cspSource};
        img-src ${webview.cspSource} https: data:;
      ">
```

### 9.2 Input Sanitization

**HTML Sanitization**:
```typescript
import DOMPurify from 'dompurify';

function sanitizeMarkdownOutput(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [/* whitelist */],
    ALLOWED_ATTR: [/* whitelist */],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload']
  });
}
```

### 9.3 Resource Loading

**Webview Resource URIs**:
```typescript
function getHtmlForWebview(webview: vscode.Webview): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.js')
  );

  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.css')
  );

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="...">
        <link href="${styleUri}" rel="stylesheet">
      </head>
      <body>
        <div id="editor"></div>
        <div id="reading" style="display:none;"></div>
        <script src="${scriptUri}"></script>
      </body>
    </html>`;
}
```

---

## 10. Performance Optimizations

### 10.1 Lazy Loading

**TreeView**:
- Only expand sections when clicked
- Load file list on-demand
- Cache file lists with TTL

**Webview**:
- Load CodeMirror only when editor opens
- Lazy load syntax highlighting for code blocks
- Defer reading mode rendering until switched

### 10.2 Debouncing & Throttling

**Content Sync**:
```typescript
const debouncedSync = debounce((content: string) => {
  vscode.postMessage({ type: 'change', content });
}, 300);

editor.updateListener.of(update => {
  if (update.docChanged) {
    debouncedSync(update.state.doc.toString());
  }
});
```

### 10.3 Virtual Rendering

**Large Files**:
- CodeMirror 6 handles viewport rendering automatically
- Decorations only built for visible range
- Incremental syntax tree updates

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Target Coverage**: 80%+

**Test Structure**:
```
tests/
├── unit/
│   ├── config/
│   │   └── loader.test.ts
│   ├── fileSystem/
│   │   ├── scanner.test.ts
│   │   └── watcher.test.ts
│   └── treeView/
│       └── provider.test.ts
```

**Example**:
```typescript
describe('ConfigManager', () => {
  describe('load', () => {
    it('should load valid config file', async () => {
      const config = await ConfigManager.load('/test/workspace');
      expect(config.sections).toHaveLength(4);
    });

    it('should return default config if file missing', async () => {
      const config = await ConfigManager.load('/empty/workspace');
      expect(config).toEqual(ConfigManager.getDefaultConfig());
    });

    it('should throw on invalid schema', async () => {
      await expect(ConfigManager.load('/invalid/workspace'))
        .rejects.toThrow('Invalid configuration');
    });
  });
});
```

### 11.2 Integration Tests

**Test Scenarios**:
- Extension activation
- TreeView rendering
- File opening in custom editor
- Mode switching
- Document sync

### 11.3 E2E Tests

**Using VS Code Extension Test Runner**:
```typescript
import * as vscode from 'vscode';

suite('Extension E2E Tests', () => {
  test('Should open markdown file in custom editor', async () => {
    const uri = vscode.Uri.file('/test/docs/file.md');
    await vscode.commands.executeCommand('vscode.openWith', uri, 'markdownEditor.editor');

    // Assert editor opened
    const activeEditor = vscode.window.activeTextEditor;
    expect(activeEditor).toBeDefined();
  });
});
```

---

## 12. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goals**:
- Extension scaffolding
- Basic TreeView with hardcoded sections
- CodeMirror 6 integration in webview
- Source mode working

**Deliverables**:
- ✅ Extension activates
- ✅ Sidebar shows file tree
- ✅ Files open in CodeMirror 6 (Source mode)
- ✅ Basic save functionality

---

### Phase 2: Live Preview (Weeks 3-4)

**Goals**:
- Implement Live Preview decorations
- Cursor-based syntax revealing
- Mode switching (Live Preview ↔ Source)

**Deliverables**:
- ✅ Live Preview mode functional
- ✅ Mode switcher toolbar
- ✅ Smooth transitions between modes

---

### Phase 3: Configuration (Week 5)

**Goals**:
- Config file support
- Dynamic section loading
- File watchers

**Deliverables**:
- ✅ `.vscode/markdown-extension-config.json` support
- ✅ Auto-refresh on file/config changes
- ✅ Create file functionality

---

### Phase 4: Reading Mode & Polish (Week 6)

**Goals**:
- Reading mode (HTML rendering)
- Theme synchronization
- Error handling

**Deliverables**:
- ✅ All three modes working
- ✅ Light/dark theme support
- ✅ Production-ready quality

---

### Phase 5: Enhanced Features (Weeks 7-8)

**Goals**:
- Context menus
- File operations
- Settings UI

**Deliverables**:
- ✅ Right-click menus
- ✅ Rename/delete/move files
- ✅ Extension settings page

---

## Appendix A: File Structure

```
vscode-markdown-extension/
├── .vscode/
│   ├── launch.json
│   ├── tasks.json
│   └── settings.json
├── src/
│   ├── extension.ts
│   ├── commands/
│   │   ├── createFile.ts
│   │   ├── deleteFile.ts
│   │   ├── renameFile.ts
│   │   └── switchMode.ts
│   ├── config/
│   │   ├── schema.ts
│   │   ├── loader.ts
│   │   └── validator.ts
│   ├── editor/
│   │   ├── customEditor.ts
│   │   ├── webview.ts
│   │   ├── webviewCollection.ts
│   │   └── modeManager.ts
│   ├── fileSystem/
│   │   ├── scanner.ts
│   │   └── watcher.ts
│   ├── treeView/
│   │   ├── provider.ts
│   │   ├── treeItem.ts
│   │   └── commands.ts
│   └── types/
│       ├── index.ts
│       ├── config.ts
│       └── messages.ts
├── webview/
│   ├── src/
│   │   ├── index.ts
│   │   ├── editor.ts
│   │   ├── livePreview.ts
│   │   ├── decorations.ts
│   │   ├── reading.ts
│   │   ├── modeSwitch.ts
│   │   ├── theme.ts
│   │   └── messageHandler.ts
│   ├── styles/
│   │   ├── editor.css
│   │   ├── reading.css
│   │   └── toolbar.css
│   ├── package.json
│   └── tsconfig.json
├── resources/
│   └── icons/
│       └── extension-icon.png
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .eslintrc.json
├── .gitignore
├── package.json
├── tsconfig.json
├── esbuild.js
└── README.md
```

---

## Appendix B: Build Configuration

**esbuild.js**:
```javascript
const esbuild = require('esbuild');

// Extension build
esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production'
});

// Webview build
esbuild.build({
  entryPoints: ['webview/src/index.ts'],
  bundle: true,
  outfile: 'out/webview.js',
  format: 'iife',
  platform: 'browser',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production'
});
```

---

**End of Design Document**

**Next Steps**:
1. Review and approve design
2. Set up project scaffolding
3. Begin Phase 1 implementation
4. Iterate based on feedback
