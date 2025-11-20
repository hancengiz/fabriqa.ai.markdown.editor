# Task: Standard Text Editor Selection & Navigation Commands

## Overview
Implement standard text editor keyboard shortcuts for selection and navigation in Live Preview mode to match VS Code's native editor behavior.

## Problem Statement
Currently, the fabriqa markdown editor in Live Preview mode is missing many standard text editor functions that users expect:
- **Shift+Down/Up** should select lines
- **Cmd+Shift+Down/Up** (or Ctrl on Windows) should select from cursor to document start/end
- **Shift+Left/Right** should extend selection character by character
- **Cmd+Shift+Left/Right** should select to line start/end
- Many other standard selection and navigation shortcuts

Users coming from VS Code or other text editors expect these to work consistently.

## Current Status
- ✅ Basic cursor movement works (arrow keys)
- ✅ Basic typing and editing works
- ✅ Some commands from `defaultKeymap` are available
- ❌ Extended selection shortcuts may not work as expected
- ❌ Need comprehensive testing to identify all gaps

## Standard VS Code Selection Shortcuts

### Line Selection
| Shortcut | Action |
|----------|--------|
| `Cmd+L` (Mac) / `Ctrl+L` (Win) | Select current line |
| `Shift+Down` | Extend selection down one line |
| `Shift+Up` | Extend selection up one line |
| `Cmd+Shift+Down` | Select from cursor to end of document |
| `Cmd+Shift+Up` | Select from cursor to start of document |

### Character/Word Selection
| Shortcut | Action |
|----------|--------|
| `Shift+Left` | Extend selection left one character |
| `Shift+Right` | Extend selection right one character |
| `Cmd+Shift+Left` | Extend selection to start of line |
| `Cmd+Shift+Right` | Extend selection to end of line |
| `Alt+Shift+Left` | Extend selection left one word |
| `Alt+Shift+Right` | Extend selection right one word |

### Block Selection
| Shortcut | Action |
|----------|--------|
| `Shift+PageDown` | Extend selection down one page |
| `Shift+PageUp` | Extend selection up one page |
| `Cmd+Shift+Home` | Select from cursor to start of document |
| `Cmd+Shift+End` | Select from cursor to end of document |

### Multiple Cursors
| Shortcut | Action |
|----------|--------|
| `Cmd+D` | Select next occurrence of current word |
| `Cmd+Shift+L` | Select all occurrences of current selection |
| `Alt+Click` | Add cursor at click position |
| `Cmd+Alt+Down` | Add cursor below |
| `Cmd+Alt+Up` | Add cursor above |

### Expand/Shrink Selection
| Shortcut | Action |
|----------|--------|
| `Shift+Ctrl+Left` (Mac) | Shrink selection |
| `Shift+Ctrl+Right` (Mac) | Expand selection |
| `Shift+Alt+Left` (Win) | Shrink selection |
| `Shift+Alt+Right` (Win) | Expand selection |

## CodeMirror 6 Command Mapping

### Available Commands (from `@codemirror/commands`)

**Cursor Movement:**
- `cursorCharLeft`, `cursorCharRight` - Move one character
- `cursorGroupLeft`, `cursorGroupRight` - Move by word
- `cursorLineUp`, `cursorLineDown` - Move by line
- `cursorPageUp`, `cursorPageDown` - Move by page
- `cursorDocStart`, `cursorDocEnd` - Jump to document start/end
- `cursorLineStart`, `cursorLineEnd` - Jump to line start/end

**Selection:**
- `selectAll` - Select entire document
- `selectLine` - Select current line
- `selectParentSyntax` - Select parent syntax node
- `selectSyntaxLeft`, `selectSyntaxRight` - Extend selection by syntax
- `selectCharLeft`, `selectCharRight` - Extend by character
- `selectGroupLeft`, `selectGroupRight` - Extend by word
- `selectLineUp`, `selectLineDown` - Extend by line
- `selectPageUp`, `selectPageDown` - Extend by page
- `selectDocStart`, `selectDocEnd` - Extend to document boundaries
- `selectLineStart`, `selectLineEnd` - Extend to line boundaries

**Multiple Selections:**
- `addSelectionAbove`, `addSelectionBelow` - Add cursor above/below
- `selectMatchingBracket` - Select to matching bracket

### Implementation Location
Commands are added via `keymap.of([...])` in `/webview/main.ts`

Currently using:
- `defaultKeymap` - Basic editing commands
- `historyKeymap` - Undo/redo
- `searchKeymap` - Search functionality
- `completionKeymap` - Autocompletion
- `lintKeymap` - Linting
- `closeBracketsKeymap` - Auto-close brackets

## Investigation Steps

### Phase 1: Audit Current Functionality
1. **Create test document** with various content types:
   - Plain text paragraphs
   - Bold/italic text
   - Headings
   - Lists
   - Code blocks
   - Tables

2. **Test each shortcut** systematically:
   - Open test document in Live Preview mode
   - Try each VS Code selection shortcut
   - Document which ones work vs. don't work
   - Note any unexpected behavior

3. **Compare with Source mode**:
   - Test same shortcuts in Source mode
   - Identify if issues are Live Preview-specific or global

### Phase 2: Identify Gaps
Create a spreadsheet or markdown table:

| Shortcut | VS Code Action | Live Preview Status | Source Status | Notes |
|----------|----------------|---------------------|---------------|-------|
| Shift+Down | Select line down | ✅/❌ | ✅/❌ | Description of issue |
| ... | ... | ... | ... | ... |

### Phase 3: Implement Missing Commands
For each gap identified:
1. Find the corresponding CodeMirror command
2. Add to keymap in `webview/main.ts`
3. Test in Live Preview mode
4. Test in Source mode
5. Verify no conflicts with existing shortcuts

### Phase 4: Handle Live Preview-Specific Issues
Some selection behaviors may need special handling in Live Preview:
- Selecting across hidden syntax (e.g., `**bold**` markers)
- Selecting through collapsed headings or code blocks
- Multi-cursor behavior with decorated text

## Example Implementation

```typescript
// In webview/main.ts

import {
  selectLine,
  selectDocStart,
  selectDocEnd,
  selectLineUp,
  selectLineDown,
  // ... other commands
} from '@codemirror/commands';

const basicExtensions = [
  // ... existing extensions
  keymap.of([
    // Selection commands
    { key: 'Mod-l', run: selectLine },
    { key: 'Mod-Shift-ArrowUp', run: selectDocStart },
    { key: 'Mod-Shift-ArrowDown', run: selectDocEnd },
    { key: 'Shift-ArrowUp', run: selectLineUp },
    { key: 'Shift-ArrowDown', run: selectLineDown },
    // ... more commands

    // Existing keymaps
    ...defaultKeymap,
    ...historyKeymap,
    // ...
  ])
];
```

## Testing Checklist

### Basic Selection
- [ ] Shift+Arrow keys extend selection character by character
- [ ] Shift+Up/Down extend selection line by line
- [ ] Cmd+Shift+Left/Right select to line boundaries
- [ ] Cmd+Shift+Up/Down select to document boundaries
- [ ] Cmd+A selects all content

### Word-Based Selection
- [ ] Alt+Shift+Left/Right extend selection by word
- [ ] Double-click selects word
- [ ] Triple-click selects line

### Multiple Cursors
- [ ] Cmd+D selects next occurrence
- [ ] Cmd+Shift+L selects all occurrences
- [ ] Alt+Click adds cursor
- [ ] Cmd+Alt+Down/Up add cursor above/below

### Page-Based Selection
- [ ] Shift+PageDown/PageUp extend by page
- [ ] Cmd+Shift+Home/End select to document start/end

### Live Preview Specific
- [ ] Selection works correctly across bold/italic markers
- [ ] Selection works across headings with hidden `#` marks
- [ ] Selection works in lists with hidden bullet markers
- [ ] Multi-cursor works with decorated syntax

### Edge Cases
- [ ] Empty lines
- [ ] Very long lines
- [ ] Mixed content (text + code blocks + tables)
- [ ] Beginning and end of document
- [ ] Read-only content (if any)

## Known Limitations

1. **CodeMirror vs Native Selection**
   - CodeMirror's selection model may differ slightly from VS Code's native editor
   - Some advanced selection features may not be possible

2. **Live Preview Decorations**
   - Hidden syntax may affect selection boundaries
   - Need to ensure selection endpoints are user-visible

3. **Platform Differences**
   - Mac uses Cmd, Windows/Linux use Ctrl
   - Need to test on all platforms
   - Some shortcuts may conflict with OS shortcuts

## Success Criteria
- ✅ All standard VS Code text selection shortcuts work in Live Preview
- ✅ All standard VS Code text selection shortcuts work in Source mode
- ✅ Selection behavior feels natural and matches user expectations
- ✅ No regressions in existing functionality
- ✅ Documentation updated with supported shortcuts

## Resources
- [VS Code Keyboard Shortcuts Reference](https://code.visualstudio.com/docs/getstarted/keybindings)
- [CodeMirror 6 Commands Documentation](https://codemirror.net/docs/ref/#commands)
- [CodeMirror 6 Keymap System](https://codemirror.net/docs/ref/#view.keymap)
- [@codemirror/commands on npm](https://www.npmjs.com/package/@codemirror/commands)

## Priority
**Medium-High** - These are expected behaviors that users will miss, but the editor is still usable without them.

## Estimated Effort
- Phase 1 (Audit): 2-3 hours
- Phase 2 (Identify gaps): 1-2 hours
- Phase 3 (Implementation): 4-8 hours (depending on number of gaps)
- Phase 4 (Live Preview specific issues): 2-4 hours
- Testing: 2-3 hours

**Total: 11-20 hours**

## Notes
- This is a "polish" task that improves UX significantly
- Should be done before any public release
- Good candidate for incremental improvement (can implement most critical shortcuts first)
- May discover issues with Live Preview decoration system during testing
