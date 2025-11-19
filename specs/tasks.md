# Implementation Tasks
## VS Code Markdown Documentation Extension

**Version**: 1.0
**Last Updated**: November 19, 2025
**Status**: Active

---

## Overview

This document breaks down the implementation of the VS Code Markdown Documentation Extension into actionable tasks across 5 phases (8 weeks total). Tasks are organized by phase and include dependencies, acceptance criteria, and references to design/requirements documents.

**Note**: This document reflects the original plan. Some architectural decisions were made differently during implementation:
- **Simplified folder structure**: Combined related functionality into fewer files
- **src/providers/**: Contains both TreeView and Editor providers (instead of separate src/treeView/ and src/editor/)
- **src/commands/index.ts**: All commands in one file (instead of separate command files)
- **webview/**: Files directly in webview/ (instead of webview/src/)
- **webview/main.ts**: Integrated message handling and mode switching (instead of separate files)

**Total Estimated Timeline**: 8 weeks
- Phase 1: Foundation (Weeks 1-2)
- Phase 2: Live Preview (Weeks 3-4)
- Phase 3: Configuration (Week 5)
- Phase 4: Reading Mode & Polish (Week 6)
- Phase 5: Enhanced Features (Weeks 7-8)

---

## Phase 1: Foundation (Weeks 1-2)

**Goal**: Basic extension scaffolding, TreeView, and CodeMirror 6 integration in Source mode

### 1.1 Project Setup

#### Task 1.1.1: Initialize Extension Project
- [x] Create extension project using `yo code`
- [x] Choose TypeScript extension template
- [x] Configure project name: `markdown-docs-editor`
- [x] Set up git repository (already done)
- [x] Initialize npm/yarn dependencies

**Acceptance Criteria**:
- Extension can be loaded in VS Code Extension Development Host
- `Hello World` command works
- Basic file structure in place

**References**: Design §12 Implementation Phases

---

#### Task 1.1.2: Configure Build System
- [x] Install esbuild as build tool
- [x] Create `esbuild.js` configuration file
- [x] Configure extension build (Node.js target)
- [x] Configure webview build (browser target)
- [x] Add build scripts to `package.json`
- [x] Test production and development builds

**Files to Create**:
- `esbuild.js`
- Update `package.json` scripts

**Acceptance Criteria**:
- `npm run build` produces `out/extension.js`
- `npm run build:webview` produces `out/webview.js`
- Source maps generated in dev mode
- Minification works in production mode

**References**: Design Appendix B

---

#### Task 1.1.3: Setup TypeScript Configuration
- [x] Configure root `tsconfig.json` for extension
- [x] Create `webview/tsconfig.json` for webview code
- [x] Configure path mappings
- [x] Set up strict type checking
- [x] Configure output directories

**Files to Create**:
- `tsconfig.json`
- `webview/tsconfig.json`

**Acceptance Criteria**:
- TypeScript compilation works without errors
- Proper type checking enabled
- Separate compilation for extension and webview

**References**: Design Appendix A

---

#### Task 1.1.4: Create Basic File Structure
- [x] Create `src/` directory structure
- [x] Create `webview/src/` directory structure
- [x] Create placeholder files for main components
- [x] Add `.gitignore` for `out/`, `node_modules/`
- [x] Create `README.md` with project overview

**Directories to Create**:
```
src/
  extension.ts
  types/
  treeView/
  editor/
  config/
  fileSystem/
webview/
  src/
    index.ts
  styles/
```

**Acceptance Criteria**:
- All directories created
- Placeholder files compile without errors
- Git ignores generated files

**References**: Design §4.1 Extension Structure

---

### 1.2 Extension Host Components

#### Task 1.2.1: Implement Extension Entry Point
- [x] Create `src/extension.ts`
- [x] Implement `activate()` function
- [x] Implement `deactivate()` function
- [x] Register extension context subscriptions
- [x] Add error handling for activation failures

**Files to Create**:
- `src/extension.ts`

**Acceptance Criteria**:
- Extension activates without errors
- Activation events configured in `package.json`
- Context properly disposed on deactivation
- Can set breakpoints and debug

**References**: Design §3.1.1

---

#### Task 1.2.2: Create Type Definitions
- [x] Create `src/config/types.ts` for configuration types *(simplified: all types in one file)*
- [x] Document all interfaces with JSDoc comments

**Files Created** *(actual implementation)*:
- `src/config/types.ts` - All type definitions

**Acceptance Criteria**:
- All interfaces properly typed
- JSDoc comments for intellisense
- No `any` types except where necessary

**References**: Design §4 Data Models

---

#### Task 1.2.3: Implement Config Manager
- [x] Create `src/config/types.ts` with interfaces *(combined schema and types)*
- [x] Create `src/config/ConfigManager.ts` with ConfigManager class
- [x] Implement `load()` method
- [x] Implement `getDefaultConfig()` method
- [x] Implement YAML and JSON config support
- [x] Add glob pattern support for dynamic file discovery

**Files Created** *(actual implementation)*:
- `src/config/types.ts`
- `src/config/ConfigManager.ts`

**Acceptance Criteria**:
- Can load config from `.vscode/markdown-extension-config.json`
- Returns default config if file missing
- Basic validation (check required fields)
- No crashes on malformed JSON

**References**: Design §3.1.4, §8 Configuration Management

---

#### Task 1.2.4: Implement File Scanner
- [x] Integrated into `src/providers/MarkdownTreeProvider.ts` *(simplified architecture)*
- [x] Use VS Code glob API with patterns from config
- [x] Implement file sorting (alphabetical)
- [x] Support glob patterns for flexible file matching
- [x] Add error handling for missing folders

**Files Created** *(actual implementation)*:
- File scanning integrated into `src/providers/MarkdownTreeProvider.ts`

**Acceptance Criteria**:
- Can scan folder for `.md` files
- Respects exclude patterns
- Returns sorted file list
- Handles non-existent folders gracefully

**References**: Design §7.1 File Discovery Strategy

---

### 1.3 TreeView Implementation

#### Task 1.3.1: Create TreeView Provider
- [x] Create `src/providers/MarkdownTreeProvider.ts` *(simplified path)*
- [x] Implement `MarkdownTreeProvider` class
- [x] Implement `getTreeItem()` method
- [x] Implement `getChildren()` method
- [x] Add `refresh()` method with event emitter
- [x] Register provider in extension activation

**Files Created** *(actual implementation)*:
- `src/providers/MarkdownTreeProvider.ts`

**Acceptance Criteria**:
- TreeView appears in sidebar
- Shows hardcoded sections (SPECS, AGENTS, COMMANDS, BOLTS)
- Sections are collapsible
- Can expand/collapse sections

**References**: Design §3.1.2

---

#### Task 1.3.2: Create TreeItem Model
- [x] Integrated into `src/providers/MarkdownTreeProvider.ts` *(simplified: inline tree items)*
- [x] Use `vscode.TreeItem` directly with dynamic properties
- [x] Add support for 'section' and 'file' types
- [x] Configure icons for sections and files
- [x] Add context values for commands

**Files Created** *(actual implementation)*:
- Tree items created inline in `src/providers/MarkdownTreeProvider.ts`

**Acceptance Criteria**:
- Tree items display correctly
- Icons show for sections and files
- Context values set properly

**References**: Design §4.3 Tree Item Model

---

#### Task 1.3.3: Integrate File Discovery with TreeView
- [x] Connect FileScanner to TreeProvider
- [x] Load files for each section on expansion
- [x] Cache file lists per section
- [x] Show file count or empty state
- [x] Handle errors in file discovery

**Files to Update**:
- `src/treeView/provider.ts`

**Acceptance Criteria**:
- Files appear under sections
- File discovery happens on section expand
- Error states handled gracefully
- Performance acceptable for 100+ files

**References**: Design §3.1.2 Data Flow

---

#### Task 1.3.4: Register TreeView in package.json
- [x] Add view container in Activity Bar
- [x] Register tree view with ID `markdownDocs`
- [x] Configure view icon
- [x] Set view title
- [x] Add activation events

**Files to Update**:
- `package.json`

**Acceptance Criteria**:
- TreeView icon appears in Activity Bar
- Clicking icon shows sidebar
- View title displays correctly

**References**: Requirements §2.1 Sidebar View

---

### 1.4 Basic Custom Editor (Source Mode Only)

#### Task 1.4.1: Create Custom Editor Provider
- [x] Create `src/providers/MarkdownEditorProvider.ts` *(simplified path)*
- [x] Implement `MarkdownEditorProvider` class
- [x] Implement `resolveCustomTextEditor()` method
- [x] Setup webview options (scripts, resources)
- [x] Implement message handling (integrated)
- [x] Register custom editor in extension activation

**Files Created** *(actual implementation)*:
- `src/providers/MarkdownEditorProvider.ts`

**Acceptance Criteria**:
- Custom editor registered for `.md` files
- Can open markdown files in custom editor
- Webview loads without errors
- Basic two-way communication works

**References**: Design §3.1.3

---

#### Task 1.4.2: Create Webview HTML Template
- [x] Integrated into `src/providers/MarkdownEditorProvider.ts` *(simplified: HTML generation in provider)*
- [x] Implement `getHtmlForWebview()` method
- [x] Add Content Security Policy
- [x] Include script and style URIs
- [x] Add editor container div
- [x] Add nonce for inline scripts

**Files Created** *(actual implementation)*:
- HTML generation in `src/providers/MarkdownEditorProvider.ts`

**Acceptance Criteria**:
- HTML template renders in webview
- CSP configured correctly
- Resources load from extension URI
- No console errors

**References**: Design §9.1 Content Security Policy

---

#### Task 1.4.3: Implement Document Synchronization
- [x] Integrated into `src/providers/MarkdownEditorProvider.ts` *(simplified: sync logic in provider)*
- [x] Implement webview → document sync
- [x] Implement document → webview sync
- [x] Handle edit messages from webview
- [x] Handle document change events

**Files Created** *(actual implementation)*:
- Sync logic in `src/providers/MarkdownEditorProvider.ts`

**Acceptance Criteria**:
- Changes in webview save to document
- External document changes update webview
- Debouncing prevents excessive updates
- No infinite loops

**References**: Design §5.2 Document Synchronization

---

#### Task 1.4.4: Setup CodeMirror 6 in Webview
- [x] Create `webview/main.ts` *(simplified path)*
- [x] Install CodeMirror 6 dependencies
- [x] Initialize basic CodeMirror editor
- [x] Configure markdown language support
- [x] Add basic extensions (history, keymap, autocomplete, search)
- [x] Setup vscode API acquisition

**Files Created** *(actual implementation)*:
- `webview/main.ts`

**Dependencies**:
```json
{
  "@codemirror/state": "^6.4.0",
  "@codemirror/view": "^6.23.0",
  "@codemirror/lang-markdown": "^6.2.4",
  "@codemirror/commands": "^6.3.3"
}
```

**Acceptance Criteria**:
- CodeMirror 6 editor renders
- Can type and edit markdown
- Syntax highlighting works
- Undo/redo functional

**References**: Design §6.1 CodeMirror 6 Setup

---

#### Task 1.4.5: Implement Webview Message Handler
- [x] Integrated into `webview/main.ts` *(simplified: message handling in main file)*
- [x] Handle `update` message
- [x] Handle `switchMode` message
- [x] Send `edit` message on document change
- [x] Send `ready` message on load
- [x] Send `console` logs to extension
- [x] Add error handling

**Files Created** *(actual implementation)*:
- Message handling in `webview/main.ts`

**Acceptance Criteria**:
- All message types handled
- Error messages sent to extension
- No unhandled message types
- Logging for debugging

**References**: Design §4.2 Message Protocol

---

#### Task 1.4.6: Implement File Open Command
- [x] Integrated into `src/commands/index.ts` *(simplified: all commands in one file)*
- [x] Implement `fabriqa.openMarkdownEditor` command
- [x] Register command in extension activation
- [x] Configure TreeItem click handler
- [x] Support opening from sidebar and command palette

**Files Created** *(actual implementation)*:
- Commands in `src/commands/index.ts`

**Acceptance Criteria**:
- Double-clicking file opens in custom editor
- File content loads correctly
- Can edit and save
- Multiple files can be open

**References**: Requirements §2.1 Interaction Patterns

---

### 1.5 Basic Save Functionality

#### Task 1.5.1: Implement Save Logic
- [x] Handle VS Code save commands (Cmd/Ctrl+S)
- [x] Implement auto-save support
- [x] Show dirty state indicator
- [x] Handle save errors
- [x] Test with multiple editors

**Files to Update**:
- `src/editor/customEditor.ts`

**Acceptance Criteria**:
- Cmd/Ctrl+S saves file
- Dirty indicator shows for unsaved changes
- Auto-save works (if enabled)
- Save errors displayed to user

**References**: Requirements §3.3 Save Behavior

---

### 1.6 Phase 1 Testing

#### Task 1.6.1: Manual Testing Checklist
- [x] Extension activates without errors
- [x] Sidebar shows tree view with sections
- [x] Can expand/collapse sections
- [x] Files appear under sections
- [x] Double-click opens file in custom editor
- [x] CodeMirror editor loads and is editable
- [x] Can save changes (Cmd/Ctrl+S)
- [x] Changes persist after reload

**References**: Design §11 Testing Strategy

---

#### Task 1.6.2: Create Test Files
- [x] Create test markdown files in sample folders
- [x] Create sample workspace configuration
- [x] Test with 10-20 files per section
- [x] Test with different markdown content

**Test Data**:
- Create `test-workspace/` with sample structure
- Minimum 4 sections with 5 files each

---

## Phase 2: Live Preview (Weeks 3-4)

**Goal**: Implement Live Preview mode with cursor-based syntax revealing

### 2.1 Live Preview Core Implementation

#### Task 2.1.1: Create Live Preview ViewPlugin
- [x] Create `webview/editors/livePreviewMode.ts` *(organized in editors/ folder)*
- [x] Implement `livePreviewPlugin` ViewPlugin
- [x] Implement decoration building
- [x] Track cursor position
- [x] Get cursor line number
- [x] Iterate syntax tree

**Files Created** *(actual implementation)*:
- `webview/editors/livePreviewMode.ts`

**Acceptance Criteria**:
- ViewPlugin loads without errors
- Can access cursor position
- Syntax tree iteration works
- No performance issues

**References**: Design §3.2.3

---

#### Task 2.1.2: Implement Emphasis Hiding
- [x] Hide `**` for bold (StrongEmphasis)
- [x] Hide `*` for italic (Emphasis)
- [x] Hide `__` for bold
- [x] Hide `_` for italic
- [x] Skip hiding if cursor on line
- [x] Add decorations for hidden marks

**Files to Update**:
- `webview/src/livePreview.ts`

**Acceptance Criteria**:
- Bold/italic syntax hidden when cursor away
- Syntax shows when cursor on line
- Decorated text renders properly
- Cursor movement updates immediately

**References**: Design §3.2.3 Implementation

---

#### Task 2.1.3: Implement Heading Hiding
- [x] Hide `#` markers for headings (ATXHeading)
- [x] Support H1 through H6
- [x] Preserve heading styling
- [x] Show markers when cursor on heading
- [x] Test with multiple heading levels

**Files to Update**:
- `webview/src/livePreview.ts`

**Acceptance Criteria**:
- Heading markers hidden
- Heading text styled correctly
- All heading levels work (H1-H6)
- Cursor reveals markers

---

#### Task 2.1.4: Implement Link Hiding
- [x] Hide link syntax `[text](url)`
- [x] Show only link text when cursor away
- [x] Reveal full syntax when cursor on link
- [x] Optionally show URL on hover
- [x] Handle reference links

**Files to Update**:
- `webview/src/livePreview.ts`

**Acceptance Criteria**:
- Link text visible, URL hidden
- Clicking link opens URL (optional)
- Cursor reveals link syntax
- Hover shows URL (optional)

---

#### Task 2.1.5: Implement Code Block Handling
- [x] Show code blocks with syntax highlighting
- [x] Hide fences ` ``` ` when cursor away
- [x] Reveal fences when cursor in block
- [x] Preserve language specifier
- [x] Test with various languages

**Files to Update**:
- `webview/src/livePreview.ts`

**Acceptance Criteria**:
- Code blocks render with highlighting
- Fences hidden when cursor outside
- Language syntax highlighting works
- Cursor reveals fences

---

#### Task 2.1.6: Create Decoration Theme
- [x] Create CSS theme for hidden elements
- [x] Use `font-size: 1px` technique
- [x] Use `letter-spacing: -1ch` technique
- [x] Set `color: transparent`
- [x] Test across themes

**Files to Create**:
- `webview/src/decorations.ts` or inline in livePreview.ts

**Acceptance Criteria**:
- Hidden syntax is invisible but clickable
- No layout shift when hiding/showing
- Works in light and dark themes
- Cursor can click hidden areas

**References**: Design §3.2.3 CSS for hiding syntax

---

### 2.2 Mode Management

#### Task 2.2.1: Create Mode Manager
- [x] Integrated into `webview/main.ts` *(simplified: mode management in main file)*
- [x] Setup Compartment for mode extensions
- [x] Implement `switchMode()` function
- [x] Track current mode state
- [x] Notify extension of mode changes

**Files Created** *(actual implementation)*:
- Mode management in `webview/main.ts`

**Acceptance Criteria**:
- Can switch between Live Preview and Source
- Mode state tracked correctly
- Extension notified of changes
- No errors during switch

**References**: Design §3.2.2

---

#### Task 2.2.2: Implement Source Mode
- [x] Create source mode extensions
- [x] Include markdown highlighting
- [x] Include line numbers (optional)
- [x] Remove Live Preview decorations
- [x] Test switching to/from Source

**Files to Create/Update**:
- `webview/src/modeSwitch.ts`

**Acceptance Criteria**:
- Source mode shows all markdown syntax
- Syntax highlighting works
- Line numbers configurable
- Switching is smooth

**References**: Requirements §2.2 Source Mode

---

#### Task 2.2.3: Create Mode Switcher Toolbar
- [x] Create `webview/styles/toolbar.css`
- [x] Add toolbar HTML to webview template
- [x] Add mode buttons (LP, SRC, RD)
- [x] Style active/inactive states
- [x] Add click handlers
- [x] Position toolbar at top of editor

**Files to Create**:
- `webview/styles/toolbar.css`

**Files to Update**:
- `src/editor/webview.ts` (HTML template)
- `webview/src/index.ts` (toolbar handlers)

**Acceptance Criteria**:
- Toolbar visible at top
- Buttons styled correctly
- Active mode highlighted
- Clicking switches modes

**References**: Requirements §2.2 Mode Switching

---

#### Task 2.2.4: Register Mode Commands
- [x] Integrated into `src/commands/index.ts` *(simplified: all commands in one file)*
- [x] Implement `fabriqa.switchToLivePreview` command
- [x] Implement `fabriqa.switchToSource` command
- [x] Implement `fabriqa.switchToReading` command
- [x] Register commands in extension
- [x] Add to package.json with keyboard shortcuts

**Files Created** *(actual implementation)*:
- Mode commands in `src/commands/index.ts`

**Files to Update**:
- `package.json` (contributes.commands)

**Acceptance Criteria**:
- Commands appear in Command Palette
- Commands work from keyboard
- Commands send message to webview
- Webview switches mode correctly

**References**: Requirements Appendix B

---

### 2.3 Phase 2 Testing

#### Task 2.3.1: Test Live Preview Functionality
- [x] Test bold hiding/revealing
- [x] Test italic hiding/revealing
- [x] Test heading hiding/revealing
- [x] Test link hiding/revealing
- [x] Test code block handling
- [x] Test cursor-based revealing
- [x] Test with complex documents

---

#### Task 2.3.2: Test Mode Switching
- [x] Test Live Preview → Source
- [x] Test Source → Live Preview
- [x] Test toolbar buttons
- [x] Test keyboard commands
- [x] Test mode persistence
- [x] Verify no content loss

---

## Phase 3: Configuration (Week 5)

**Goal**: Config file support, dynamic sections, file watchers

### 3.1 Configuration System

#### Task 3.1.1: Implement Config Validation
- [x] Create `src/config/validator.ts`
- [x] Define JSON Schema for config
- [x] Implement schema validation
- [x] Check folder path existence
- [x] Validate section IDs are unique
- [x] Provide helpful error messages

**Files to Create**:
- `src/config/validator.ts`

**Acceptance Criteria**:
- Invalid config rejected with clear error
- Missing folders reported
- Duplicate section IDs caught
- Helpful error messages shown

**References**: Design §8.2 Configuration Validation

---

#### Task 3.1.2: Implement Config Watcher
- [x] Watch config file for changes
- [x] Reload config on change
- [x] Refresh TreeView on config change
- [x] Handle config file deletion
- [x] Show notification on reload

**Files to Update**:
- `src/config/loader.ts`

**Acceptance Criteria**:
- Config changes detected automatically
- TreeView refreshes on config change
- No crashes on invalid config
- User notified of reload

**References**: Design §8.1 Configuration Loading

---

#### Task 3.1.3: Implement Dynamic Section Loading
- [x] Remove hardcoded sections
- [x] Load sections from config
- [x] Support custom icons
- [x] Support custom labels
- [x] Support folder paths
- [x] Test with 1-10 sections

**Files to Update**:
- `src/treeView/provider.ts`

**Acceptance Criteria**:
- Sections loaded from config
- Custom icons display
- Custom labels work
- Folder paths resolved correctly

**References**: Requirements §3.1 Configuration System

---

### 3.2 File Watching

#### Task 3.2.1: Implement File Watcher
- [x] Create `src/fileSystem/watcher.ts`
- [x] Implement `FileWatcher` class
- [x] Watch for file create/delete/change
- [x] Setup watchers for each section
- [x] Dispose watchers properly
- [x] Handle watch errors

**Files to Create**:
- `src/fileSystem/watcher.ts`

**Acceptance Criteria**:
- New files appear in TreeView immediately
- Deleted files removed from TreeView
- Changed files trigger refresh
- Watchers disposed on extension deactivate

**References**: Design §7.2 File Watching

---

#### Task 3.2.2: Integrate File Watcher with TreeView
- [x] Setup watchers in extension activation
- [x] Connect watcher events to TreeView refresh
- [x] Debounce rapid changes
- [x] Test with file create/delete/rename
- [x] Handle multiple simultaneous changes

**Files to Update**:
- `src/extension.ts`
- `src/treeView/provider.ts`

**Acceptance Criteria**:
- TreeView updates automatically
- No excessive refreshes
- Smooth UI updates
- Performance good with many changes

---

### 3.3 Create File Functionality

#### Task 3.3.1: Implement Create File Command
- [x] Create `src/commands/createFile.ts`
- [x] Show input box for file name
- [x] Validate file name
- [x] Create file in section folder
- [x] Add `.md` extension if missing
- [x] Open new file in editor

**Files to Create**:
- `src/commands/createFile.ts`

**Acceptance Criteria**:
- [+] button shows input box
- File created in correct folder
- `.md` extension added automatically
- Invalid names rejected
- New file opens in editor

**References**: Requirements §2.1 Interaction Patterns

---

#### Task 3.3.2: Add Create Button to TreeView
- [x] Add [+] button to section headers
- [x] Register click handler
- [x] Pass section info to command
- [x] Test with all sections
- [x] Handle errors gracefully

**Files to Update**:
- `src/treeView/provider.ts`
- `package.json` (view title commands)

**Acceptance Criteria**:
- [+] button visible on sections
- Clicking prompts for file name
- File created in correct section
- TreeView updates automatically

---

### 3.4 Phase 3 Testing

#### Task 3.4.1: Test Configuration
- [x] Test valid config file
- [x] Test invalid config file
- [x] Test missing config (defaults)
- [x] Test config file changes
- [x] Test section add/remove
- [x] Test custom icons and labels

---

#### Task 3.4.2: Test File Operations
- [x] Test create file via [+] button
- [x] Test file appears in TreeView
- [x] Test file watcher detects new files
- [x] Test file watcher detects deletions
- [x] Test rapid file operations

---

## Phase 4: Reading Mode & Polish (Week 6)

**Goal**: Implement Reading mode, theme sync, error handling

### 4.1 Reading Mode Implementation

#### Task 4.1.1: Setup Markdown Renderer
- [x] Install `marked` library
- [x] Install `dompurify` library
- [x] Create `webview/editors/readingMode.ts` *(organized in editors/ folder)*
- [x] Configure marked options (GFM, breaks, etc.)
- [x] Implement reading mode plugin
- [x] Add HTML sanitization with DOMPurify

**Files Created** *(actual implementation)*:
- `webview/editors/readingMode.ts`

**Dependencies**:
```json
{
  "marked": "^11.1.0",
  "dompurify": "^3.0.6"
}
```

**Acceptance Criteria**:
- Markdown renders to HTML
- GFM features work (tables, task lists)
- HTML sanitized properly
- No XSS vulnerabilities

**References**: Design §3.2.4

---

#### Task 4.1.2: Create Reading Mode UI
- [x] Add reading container to webview HTML
- [x] Create `webview/styles/reading.css`
- [x] Style rendered HTML elements
- [x] Match VS Code theme colors
- [x] Add padding and typography
- [x] Test with various markdown

**Files to Create**:
- `webview/styles/reading.css`

**Files to Update**:
- `src/editor/webview.ts` (add reading div)

**Acceptance Criteria**:
- Reading mode looks clean
- Styles match VS Code theme
- Typography is readable
- All elements styled

---

#### Task 4.1.3: Implement Reading Mode Switch
- [x] Add `switchToReading()` to ModeManager
- [x] Hide CodeMirror editor
- [x] Show reading container
- [x] Render markdown to HTML
- [x] Update toolbar state
- [x] Test switching to/from Reading

**Files to Update**:
- `webview/src/modeSwitch.ts`

**Acceptance Criteria**:
- Can switch to Reading mode
- HTML renders correctly
- Can switch back to editing modes
- Content stays in sync

**References**: Requirements §2.2 Reading Mode

---

#### Task 4.1.4: Register Reading Mode Command
- [x] Add `switchToReading` command
- [x] Add keyboard shortcut (optional)
- [x] Update toolbar to include RD button
- [x] Test from Command Palette
- [x] Test from keyboard

**Files to Update**:
- `src/commands/switchMode.ts`
- `package.json`

**Acceptance Criteria**:
- Command works from palette
- Toolbar button works
- Keyboard shortcut works (if added)

---

### 4.2 Theme Synchronization

#### Task 4.2.1: Detect VS Code Theme
- [x] Get current theme type (light/dark)
- [x] Send theme to webview on init
- [x] Listen for theme change events
- [x] Send theme change to webview
- [x] Test with theme switches

**Files to Update**:
- `src/editor/customEditor.ts`

**Acceptance Criteria**:
- Webview knows current theme
- Theme changes detected
- Webview notified of changes

**References**: Design §6.2 Extension Compartments

---

#### Task 4.2.2: Implement Webview Theme Manager
- [x] Create `webview/src/theme.ts`
- [x] Apply theme to CodeMirror
- [x] Apply theme to Reading mode
- [x] Apply theme to toolbar
- [x] Create light theme styles
- [x] Create dark theme styles

**Files to Create**:
- `webview/src/theme.ts`

**Acceptance Criteria**:
- Light theme looks good
- Dark theme looks good
- Theme switches smoothly
- All UI elements themed

---

### 4.3 Error Handling & Polish

#### Task 4.3.1: Add Error Boundaries
- [x] Add try/catch in critical paths
- [x] Show error notifications to user
- [x] Log errors to console
- [x] Handle webview errors gracefully
- [x] Prevent extension crashes

**Files to Update**:
- All source files with critical code

**Acceptance Criteria**:
- Errors don't crash extension
- User sees helpful error messages
- Errors logged for debugging

---

#### Task 4.3.2: Add Loading States
- [x] Show loading indicator for editor
- [x] Show loading for TreeView
- [x] Show loading for file operations
- [x] Add skeleton screens (optional)
- [x] Test with slow operations

**Acceptance Criteria**:
- Loading states visible
- User knows something is happening
- Smooth transitions

---

#### Task 4.3.3: Improve UX Polish
- [x] Add icons to TreeView items
- [x] Add tooltips where helpful
- [x] Improve error messages
- [x] Add keyboard shortcuts
- [x] Smooth animations
- [x] Accessibility improvements

**Acceptance Criteria**:
- UI feels polished
- Keyboard navigation works
- Screen readers supported
- Animations smooth

---

### 4.4 Phase 4 Testing

#### Task 4.4.1: Test All Three Modes
- [ ] Test Live Preview mode thoroughly
- [ ] Test Source mode thoroughly
- [ ] Test Reading mode thoroughly
- [ ] Test switching between all modes
- [x] Test mode persistence

---

#### Task 4.4.2: Test Theme Support
- [x] Test light theme
- [x] Test dark theme
- [x] Test theme switching
- [x] Test all modes with both themes
- [x] Test custom themes (optional)

---

#### Task 4.4.3: Integration Testing
- [x] Test complete workflow (create → edit → save)
- [x] Test with multiple open editors
- [x] Test with large files (1MB+)
- [x] Test with complex markdown
- [x] Performance testing

---

## Phase 5: Enhanced Features (Weeks 7-8)

**Goal**: Context menus, file operations, settings UI

### 5.1 Context Menus

#### Task 5.1.1: Implement File Context Menu
- [x] Add right-click menu to files
- [x] Add "Rename" option
- [x] Add "Delete" option
- [x] Add "Copy Path" option
- [x] Add "Reveal in Explorer" option
- [x] Register menu contributions

**Files to Update**:
- `package.json` (menus contribution)

**Acceptance Criteria**:
- Right-click shows context menu
- Menu items appropriate for files
- Commands work correctly

---

#### Task 5.1.2: Implement Section Context Menu
- [x] Add right-click menu to sections
- [x] Add "New File" option
- [x] Add "Refresh" option
- [x] Add "Collapse All" option
- [x] Register menu contributions

**Files to Update**:
- `package.json` (menus contribution)

**Acceptance Criteria**:
- Right-click shows context menu
- Menu items appropriate for sections
- Commands work correctly

**References**: Requirements §2.1 Interaction Patterns

---

### 5.2 File Operations

#### Task 5.2.1: Implement Delete File
- [x] Create `src/commands/deleteFile.ts`
- [x] Show confirmation dialog
- [x] Delete file from filesystem
- [x] Refresh TreeView
- [x] Close editor if open
- [x] Handle errors

**Files to Create**:
- `src/commands/deleteFile.ts`

**Acceptance Criteria**:
- Confirmation required
- File deleted successfully
- TreeView updates
- Open editor closes
- Errors handled

---

#### Task 5.2.2: Implement Rename File
- [x] Create `src/commands/renameFile.ts`
- [x] Show input with current name
- [x] Validate new name
- [x] Rename file on filesystem
- [x] Update open editors
- [x] Refresh TreeView

**Files to Create**:
- `src/commands/renameFile.ts`

**Acceptance Criteria**:
- Shows current name in input
- Validates new name
- File renamed successfully
- Editor updates with new name
- TreeView shows new name

---

#### Task 5.2.3: Implement Copy Path
- [ ] Create `src/commands/copyPath.ts`
- [ ] Get file path
- [ ] Copy to clipboard
- [ ] Show confirmation
- [ ] Support relative and absolute paths

**Files to Create**:
- `src/commands/copyPath.ts`

**Acceptance Criteria**:
- Path copied to clipboard
- User notified of success
- Paste works in other apps

---

### 5.3 Search & Filter

#### Task 5.3.1: Add Search Box to TreeView
- [x] Add search input to view
- [x] Filter files by name
- [x] Highlight matching text
- [x] Clear search button
- [x] Test with many files

**Files to Update**:
- `src/treeView/provider.ts`
- `package.json` (view welcome content)

**Acceptance Criteria**:
- Search box visible
- Typing filters results
- Clear button works
- Performance good with many files

---

### 5.4 Settings UI

#### Task 5.4.1: Add Extension Settings
- [x] Add settings to `package.json`
- [x] `defaultMode` setting
- [x] `autoRefresh` setting
- [x] `toolbar` visibility setting
- [x] `theme` preference setting
- [x] `lineNumbers` setting
- [x] Document all settings

**Files to Update**:
- `package.json` (contributes.configuration)

**Acceptance Criteria**:
- Settings appear in VS Code settings UI
- Settings work as documented
- Defaults are reasonable

**References**: Requirements Appendix C

---

#### Task 5.4.2: Implement Settings Integration
- [x] Read settings in extension
- [x] Pass settings to webview
- [x] Apply settings to editor
- [x] Listen for setting changes
- [x] Update UI when settings change

**Files to Update**:
- `src/extension.ts`
- `src/editor/customEditor.ts`
- `webview/src/index.ts`

**Acceptance Criteria**:
- Settings applied correctly
- Changes take effect immediately
- No restart required

---

### 5.5 Multi-Root Workspace Support

#### Task 5.5.1: Support Multiple Workspace Folders
- [ ] Detect multiple workspace folders
- [ ] Load config from each folder
- [ ] Prefix sections with folder name
- [ ] Merge sections in TreeView
- [ ] Test with 2-3 workspace folders

**Files to Update**:
- `src/extension.ts`
- `src/config/loader.ts`
- `src/treeView/provider.ts`

**Acceptance Criteria**:
- Works with multi-root workspaces
- Sections clearly labeled by folder
- Can distinguish files from different folders

**References**: Requirements §6.4 Compatibility

---

### 5.6 Documentation

#### Task 5.6.1: Create README
- [ ] Write extension overview
- [ ] Add features list
- [ ] Add screenshots/GIFs
- [ ] Document configuration
- [ ] Add usage examples
- [ ] Add troubleshooting section

**Files to Create/Update**:
- `README.md`

**Acceptance Criteria**:
- Clear, comprehensive README
- Screenshots show key features
- Installation instructions clear

---

#### Task 5.6.2: Create CHANGELOG
- [x] Document initial release (v0.1.0)
- [x] List all features
- [x] Follow Keep a Changelog format
- [x] Include version numbers

**Files to Create**:
- `CHANGELOG.md`

---

### 5.7 Marketplace Preparation

#### Task 5.7.1: Create Extension Icon
- [ ] Design extension icon (128x128)
- [ ] Export as PNG
- [ ] Add to extension package
- [ ] Test in marketplace

**Files to Create**:
- `resources/icons/extension-icon.png`

**Files to Update**:
- `package.json` (icon field)

---

#### Task 5.7.2: Update package.json Metadata
- [ ] Set display name
- [ ] Write description
- [ ] Add keywords
- [ ] Add categories
- [ ] Add repository URL
- [ ] Set license
- [ ] Add homepage URL

**Files to Update**:
- `package.json`

---

### 5.8 Phase 5 Testing

#### Task 5.8.1: End-to-End Testing
- [ ] Test complete user workflows
- [ ] Test all commands
- [ ] Test all context menus
- [ ] Test file operations
- [ ] Test settings
- [ ] Test multi-root workspaces

---

#### Task 5.8.2: Performance Testing
- [ ] Test with 100+ files
- [ ] Test with 5MB+ files
- [ ] Test rapid file operations
- [ ] Measure startup time
- [ ] Measure mode switch time
- [ ] Profile memory usage

---

#### Task 5.8.3: Cross-Platform Testing
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test on Linux
- [ ] Test with Remote - SSH
- [ ] Test with Remote - Containers

---

## Testing & Quality Assurance

### Unit Tests

#### Task: Setup Testing Framework
- [ ] Install testing dependencies (mocha, chai, etc.)
- [ ] Configure test scripts in package.json
- [ ] Create test directory structure
- [ ] Write example test
- [ ] Run tests in CI (optional)

**Files to Create**:
- `tests/unit/` directory structure
- `.mocharc.json` or test config

---

#### Task: Write Unit Tests for Core Components
- [ ] ConfigManager tests (10+ tests)
- [ ] FileScanner tests (5+ tests)
- [ ] TreeProvider tests (5+ tests)
- [ ] Validation tests (10+ tests)
- [ ] Message protocol tests (5+ tests)

**Target**: 80%+ code coverage

**References**: Design §11.1 Unit Tests

---

### Integration Tests

#### Task: Setup Integration Testing
- [x] Configure VS Code extension test runner
- [x] Create test workspace
- [x] Write integration test examples
- [x] Add test script to package.json

**Files to Create**:
- `tests/integration/` directory

---

#### Task: Write Integration Tests
- [x] Extension activation test
- [x] TreeView rendering test
- [x] File opening test
- [x] Mode switching test
- [x] File operations test

**References**: Design §11.2 Integration Tests

---

## Documentation Tasks

### Task: Create Developer Guide
- [ ] Document architecture
- [ ] Explain component interactions
- [ ] Add code examples
- [ ] Document message protocol
- [ ] Add debugging tips

**Files to Create**:
- `docs/DEVELOPMENT.md`

---

### Task: Create Contributing Guide
- [ ] Explain how to contribute
- [ ] Document coding standards
- [ ] Explain PR process
- [ ] Add issue templates

**Files to Create**:
- `CONTRIBUTING.md`
- `.github/ISSUE_TEMPLATE/` templates

---

## Deployment Tasks

### Task: Prepare for Initial Release
- [ ] Bump version to 0.1.0
- [ ] Update CHANGELOG
- [ ] Test VSIX package locally
- [ ] Create GitHub release
- [ ] Publish to VS Code Marketplace

---

### Task: Setup CI/CD (Optional)
- [ ] Configure GitHub Actions
- [ ] Add build workflow
- [ ] Add test workflow
- [ ] Add publish workflow
- [ ] Add automated versioning

**Files to Create**:
- `.github/workflows/build.yml`
- `.github/workflows/test.yml`
- `.github/workflows/publish.yml`

---

## Post-Launch Tasks (Phase 4+)

### Future Enhancements (Not in MVP)

#### Task: Implement Collaborative Commenting
- [ ] Choose commenting library (from research)
- [ ] Integrate with CodeMirror 6
- [ ] Add comment UI
- [ ] Implement comment storage
- [ ] Add comment threads
- [ ] Test with multiple users

**Timeline**: 2-3 weeks
**References**: Research §Collaborative Commenting

---

#### Task: Implement Math Equation Support
- [ ] Choose library (KaTeX or MathJax)
- [ ] Add to Reading mode
- [ ] Add to Live Preview mode
- [ ] Test with LaTeX syntax
- [ ] Document usage

**Timeline**: 1 week

---

#### Task: Implement Diagram Support
- [ ] Integrate Mermaid
- [ ] Add diagram rendering
- [ ] Support flow charts
- [ ] Support sequence diagrams
- [ ] Test in all modes

**Timeline**: 1 week

---

#### Task: Implement Split View
- [ ] Create split pane layout
- [ ] Show Live Preview + Source side-by-side
- [ ] Sync scrolling
- [ ] Sync cursor position
- [ ] Add toggle command

**Timeline**: 1-2 weeks

---

## Summary

**Total Tasks**: 130+ tasks across 5 phases
**Estimated Timeline**: 8 weeks
**MVP Deliverable**: Phase 1-3 (5 weeks)
**Production Ready**: Phase 1-5 (8 weeks)

### Phase Breakdown

| Phase | Duration | Tasks | Key Deliverables |
|-------|----------|-------|------------------|
| Phase 1 | 2 weeks | 25 tasks | Extension scaffold, TreeView, Basic editor (Source mode) |
| Phase 2 | 2 weeks | 15 tasks | Live Preview mode with cursor-based syntax revealing |
| Phase 3 | 1 week | 12 tasks | Config file support, File watchers, Create file |
| Phase 4 | 1 week | 15 tasks | Reading mode, Theme sync, Error handling |
| Phase 5 | 2 weeks | 20 tasks | Context menus, File operations, Settings, Multi-root |
| **Total** | **8 weeks** | **87 core tasks** | **Production-ready extension** |

### Next Steps

1. ✅ Review this task breakdown
2. ⏭️ Create GitHub project/issues from tasks
3. ⏭️ Begin Phase 1, Task 1.1.1 (Initialize Project)
4. ⏭️ Track progress using todo list or project board
5. ⏭️ Update this document as tasks completed

---

**Last Updated**: November 19, 2025
**Status**: Ready for Implementation
