# Implementation Tasks - Index

**Version**: 1.0
**Last Updated**: November 20, 2025
**Status**: Active

---

## Overview

This directory contains all implementation tasks for the fabriqa.ai Markdown Editor extension, organized by development phase and feature area.

**Total Estimated Timeline**: 8 weeks (MVP in 5 weeks)

---

## Task Organization

Tasks are split into separate files for better maintainability and navigation:

### Core Implementation Phases

1. **[Phase 1: Foundation](./phase-1-foundation.md)** (Weeks 1-2)
   - Extension scaffolding
   - TreeView implementation
   - Basic Custom Editor (Source mode)
   - CodeMirror 6 integration

2. **[Phase 2: Live Preview](./phase-2-live-preview.md)** (Weeks 3-4)
   - Live Preview mode implementation
   - Cursor-based syntax revealing
   - Decoration system
   - Mode management

3. **[Phase 3: Configuration](./phase-3-configuration.md)** (Week 5)
   - Config file support
   - Dynamic sections
   - File watching
   - Create file functionality

4. **[Phase 4: Reading Mode & Polish](./phase-4-reading-mode-polish.md)** (Week 6)
   - Reading mode with marked.js
   - Theme synchronization
   - Error handling
   - UX polish

5. **[Phase 5: Enhanced Features](./phase-5-enhanced-features.md)** (Weeks 7-8)
   - Context menus
   - File operations (rename, delete)
   - Search & filter
   - Settings UI
   - Multi-root workspace support

### Quality Assurance & Deployment

6. **[Testing, QA & Deployment](./testing-qa-deployment.md)**
   - Unit tests
   - Integration tests
   - Documentation tasks
   - Deployment preparation
   - CI/CD setup

### Feature-Specific Tasks

7. **[Mermaid Diagram Support](./mermaid-diagram-support.md)**
   - Reading mode rendering
   - Interactive Live Preview toggle
   - View Code button
   - Error handling

8. **[Interactive Mermaid Live Preview](./interactive-mermaid-live-preview.md)** (Detailed Spec)
   - Comprehensive implementation guide
   - Widget-based rendering
   - Toggle functionality
   - Testing checklist

9. **[Standard Editor Selection Commands](./standard-editor-selection-commands.md)**
   - VS Code-style selection shortcuts
   - Line, word, and character selection
   - Multiple cursors support
   - CodeMirror command mapping

10. **[Native VS Code Search Support](./native-vscode-search-support.md)**
    - Cmd+F / Ctrl+F search integration
    - Find and replace functionality
    - Mode-specific search behavior
    - CodeMirror search implementation

11. **[Code Block Styling Improvements](./code-block-styling-improvements.md)**
    - Reading Mode code block backgrounds
    - Table alternating row colors
    - Theme-aware styling
    - Syntax highlighting considerations

12. **[Live Preview Decoration Issue](./live-preview-decoration-issue.md)** (Investigation/Bug Report)
    - Analysis of decoration conflicts
    - Root cause investigation
    - Alternative approaches
    - Recommended solutions

---

## Quick Navigation

### By Status
- **Completed**: Most of Phases 1-4 ✅
- **In Progress**: Phase 5 features, Mermaid support 🚧
- **Planned**: Post-launch enhancements 📋

### By Priority
- **High**: Live Preview polish, Mermaid support
- **Medium**: Enhanced file operations, search
- **Low**: Multi-root workspace, post-launch features

### By Component
- **Extension Host**: `phase-1-foundation.md` §1.2
- **TreeView**: `phase-1-foundation.md` §1.3, `phase-3-configuration.md`
- **Webview/Editor**: `phase-1-foundation.md` §1.4, `phase-2-live-preview.md`
- **Reading Mode**: `phase-4-reading-mode-polish.md` §4.1
- **Configuration**: `phase-3-configuration.md`
- **Testing**: `testing-qa-deployment.md`

---

## Architecture Notes

**Note**: This implementation used a simplified folder structure compared to the original design:

- **Combined providers**: `src/providers/` contains both TreeView and Editor providers
- **Unified commands**: `src/commands/index.ts` contains all commands in one file
- **Direct webview files**: Files in `webview/` instead of `webview/src/`
- **Integrated message handling**: `webview/main.ts` handles messages and mode switching

This simplification improved code maintainability while keeping all planned functionality.

---

## Progress Summary

### Phase Completion

| Phase | Status | Tasks Completed | Key Deliverables |
|-------|--------|-----------------|------------------|
| Phase 1 | ✅ Complete | 25/25 | Extension scaffold, TreeView, Source mode |
| Phase 2 | ✅ Complete | 15/15 | Live Preview with syntax hiding |
| Phase 3 | ✅ Complete | 12/12 | Config support, file watchers |
| Phase 4 | ✅ ~95% | 14/15 | Reading mode, themes, error handling |
| Phase 5 | 🚧 In Progress | 12/20 | Context menus, file ops, settings |
| Testing | 🚧 In Progress | 8/15 | Integration tests, documentation |
| **Total** | **~85%** | **86/102** | **Production-ready extension** |

### Recent Accomplishments

- ✅ Fixed overlapping decorations bug in Live Preview (line 13 bold markers)
- ✅ Created reusable `lib/markdown-live-preview/` library
- ✅ Improved Reading Mode code block backgrounds
- ✅ Added debug logging toggle setting
- ✅ Implemented checkbox widgets in Live Preview
- ✅ Added link widgets with Cmd+Click support
- ✅ **Completed Mermaid diagram support** (Reading Mode + Live Preview with interactive toggle)

### Current Focus

- 🚧 Live Preview spec documentation
- 🚧 Enhanced file operations
- 🚧 Documentation improvements

---

## How to Use This Directory

1. **Find your task**: Navigate to the appropriate phase or feature file
2. **Check dependencies**: Review task prerequisites and related files
3. **Update status**: Mark tasks as completed using `[x]` in checkbox
4. **Track progress**: Update the Progress Summary above
5. **Document changes**: Note architectural decisions and deviations

---

## Related Documentation

- **Design Spec**: See original design documents (referenced in tasks)
- **Requirements**: See requirements documents (referenced in tasks)
- **API Reference**: CodeMirror 6 docs, VS Code API docs
- **Library Docs**: `webview/lib/markdown-live-preview/README.md`

---

## Contributing

When adding new tasks:
1. Determine which file they belong in (or create a new feature-specific file)
2. Follow the existing task format with acceptance criteria
3. Include file references and time estimates
4. Update this index with links to new task files
5. Update the Progress Summary

---

**Last Updated**: November 20, 2025
**Maintained By**: Development Team
