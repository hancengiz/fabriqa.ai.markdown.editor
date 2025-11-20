# Task: Standard Text Editor Functions Support in Live Preview Mode

## Overview
Ensure all standard text editor keyboard shortcuts and selection functions work correctly in Live Preview mode, matching the behavior users expect from VS Code and other text editors.

## Problem Statement
Live Preview mode may not support all standard text editor functions that users expect, such as:
- Line selection with Shift + Arrow keys
- Document selection with Cmd/Ctrl + Shift + Arrow keys
- Multiple cursor operations
- Other standard navigation and selection commands

This task is to audit, test, and implement missing functionality.

## Standard Editor Functions to Support

### 1. Selection Commands

#### Basic Selection
- **Shift + Left/Right Arrow** - Extend selection by character
- **Shift + Up/Down Arrow** - Extend selection by line
- **Shift + Cmd/Ctrl + Left/Right** - Extend selection to start/end of line
- **Shift + Cmd/Ctrl + Up/Down** - Extend selection to start/end of document
- **Shift + Option/Alt + Left/Right** - Extend selection by word
- **Cmd/Ctrl + A** - Select all

#### Advanced Selection
- **Cmd/Ctrl + D** - Select word at cursor, or next occurrence
- **Cmd/Ctrl + Shift + L** - Select all occurrences of current selection
- **Shift + Alt/Option + Left/Right** - Shrink/expand selection (semantic selection)
- **Cmd/Ctrl + L** - Select current line

### 2. Multiple Cursors

- **Alt/Option + Click** - Add cursor at click position
- **Cmd/Ctrl + Alt/Option + Up/Down** - Add cursor above/below
- **Cmd/Ctrl + Shift + Alt/Option + Arrow keys** - Add cursor in direction
- **Esc** - Exit multiple cursor mode / collapse to single cursor

### 3. Navigation Commands

#### Basic Navigation
- **Home** - Move to start of line
- **End** - Move to end of line
- **Cmd/Ctrl + Home** - Move to start of document
- **Cmd/Ctrl + End** - Move to end of document
- **Page Up/Down** - Scroll by page
- **Cmd/Ctrl + Up/Down** - Scroll to top/bottom

#### Word/Token Navigation
- **Option/Alt + Left/Right** - Move cursor by word
- **Cmd/Ctrl + Left/Right** - Move to start/end of line

### 4. Deletion Commands

- **Backspace** - Delete character before cursor
- **Delete** - Delete character after cursor
- **Cmd/Ctrl + Backspace** - Delete word before cursor
- **Cmd/Ctrl + Delete** - Delete word after cursor
- **Cmd/Ctrl + Shift + K** - Delete line
- **Cmd/Ctrl + K + Cmd/Ctrl + K** - Delete to end of line

### 5. Line Operations

- **Cmd/Ctrl + Enter** - Insert line below
- **Cmd/Ctrl + Shift + Enter** - Insert line above
- **Alt/Option + Up/Down** - Move line up/down
- **Shift + Alt/Option + Up/Down** - Copy line up/down
- **Cmd/Ctrl + /** - Toggle line comment
- **Cmd/Ctrl + Shift + /** - Toggle block comment

### 6. Indentation

- **Tab** - Indent line or selection
- **Shift + Tab** - Outdent line or selection
- **Cmd/Ctrl + ]** - Indent line
- **Cmd/Ctrl + [** - Outdent line

### 7. Find and Replace

- **Cmd/Ctrl + F** - Find
- **Cmd/Ctrl + H** - Replace
- **Cmd/Ctrl + G** - Find next
- **Cmd/Ctrl + Shift + G** - Find previous
- **F3** - Find next (Windows/Linux)
- **Shift + F3** - Find previous (Windows/Linux)

### 8. Clipboard Operations

- **Cmd/Ctrl + C** - Copy
- **Cmd/Ctrl + X** - Cut
- **Cmd/Ctrl + V** - Paste
- **Cmd/Ctrl + Shift + V** - Paste and match style

### 9. Undo/Redo

- **Cmd/Ctrl + Z** - Undo
- **Cmd/Ctrl + Shift + Z** - Redo (Windows/Linux)
- **Cmd/Ctrl + Y** - Redo (alternative)

## CodeMirror 6 Commands Reference

### Available in @codemirror/commands

Based on web search, CodeMirror 6 provides these command categories:

1. **Selection Commands**
   - `selectAll` - Select entire document
   - `selectLine` - Select current line
   - `selectParentSyntax` - Select parent syntax node
   - `selectNextOccurrence` - Select next occurrence of selection

2. **Cursor Movement**
   - `cursorCharLeft/Right` - Move by character
   - `cursorCharForward/Backward` - Logical movement
   - `cursorGroupLeft/Right` - Move by word
   - `cursorLineUp/Down` - Move by line
   - `cursorPageUp/Down` - Move by page
   - `cursorLineBoundaryForward/Backward` - Move to line start/end
   - `cursorDocStart/End` - Move to document start/end

3. **Deletion Commands**
   - `deleteCharBackward/Forward`
   - `deleteGroupBackward/Forward` - Delete word
   - `deleteLine`
   - `deleteToLineStart/End`

4. **Line Operations**
   - `moveLineUp/Down`
   - `copyLineUp/Down`
   - `insertNewlineAndIndent`
   - `insertNewline`

5. **Indentation**
   - `indentMore/Less`
   - `indentSelection`

## Implementation Strategy

### Phase 1: Audit Current State
1. **Test all standard shortcuts** in Live Preview mode
2. **Document which work** and which don't
3. **Create a compatibility matrix** comparing to VS Code behavior

### Phase 2: Verify CodeMirror Integration
1. **Check if `defaultKeymap` is properly loaded**
2. **Review `keymap.of([...])` configuration** in `main.ts`
3. **Verify Live Preview mode doesn't block** standard commands

### Phase 3: Fix Gaps
1. **Add missing keymaps** from CodeMirror 6
2. **Test with markdown-specific edge cases** (e.g., selecting across hidden syntax)
3. **Ensure Live Preview decorations don't interfere** with selection

### Phase 4: Testing
1. **Manual testing** of all shortcuts on Mac and Windows/Linux
2. **Create test document** with various markdown elements
3. **Test interaction** between Live Preview decorations and selection

## Files to Review/Modify

### `/webview/main.ts`
Current keymap configuration (lines 46-90):
```typescript
keymap.of([
  ...closeBracketsKeymap,
  ...defaultKeymap,
  ...searchKeymap,
  ...historyKeymap,
  ...completionKeymap,
  ...lintKeymap
])
```

**Verify:**
- Is `defaultKeymap` complete?
- Are all necessary CodeMirror commands included?
- Do we need to add additional keymaps?

### `/webview/editors/livePreviewMode.ts`
**Verify:**
- Do decorations interfere with text selection?
- Does `Decoration.replace()` affect cursor movement?
- Are selection boundaries correct when syntax is hidden?

### `/webview/editors/markdownCommands.ts`
Currently implements markdown-specific commands:
- `toggleBold`, `toggleItalic`, etc.

**Verify:**
- Do these commands interfere with standard editor commands?
- Are there conflicts with CodeMirror's built-in commands?

## Testing Checklist

### Selection Testing
- [ ] Shift + Down arrow selects current line
- [ ] Shift + Down arrow (repeated) extends selection line by line
- [ ] Cmd/Ctrl + Shift + Down selects from cursor to end of document
- [ ] Cmd/Ctrl + Shift + Up selects from cursor to start of document
- [ ] Shift + Left/Right extends selection by character
- [ ] Shift + Alt/Option + Left/Right extends selection by word
- [ ] Cmd/Ctrl + A selects all
- [ ] Selection works correctly across hidden markdown syntax (e.g., `**bold**`)

### Multiple Cursor Testing
- [ ] Alt/Option + Click adds cursor
- [ ] Cmd/Ctrl + Alt/Option + Down adds cursor below
- [ ] Cmd/Ctrl + Alt/Option + Up adds cursor above
- [ ] Multiple cursors work with typing
- [ ] Multiple cursors work with deletion
- [ ] Esc exits multiple cursor mode

### Navigation Testing
- [ ] Home/End move to line start/end
- [ ] Cmd/Ctrl + Home/End move to document start/end
- [ ] Alt/Option + Left/Right move by word
- [ ] Page Up/Down scroll correctly

### Line Operations Testing
- [ ] Alt/Option + Up/Down move line
- [ ] Shift + Alt/Option + Up/Down copy line
- [ ] Cmd/Ctrl + Shift + K deletes line
- [ ] Cmd/Ctrl + Enter inserts line below
- [ ] Cmd/Ctrl + Shift + Enter inserts line above

### Edge Cases
- [ ] Selection across multiple bold sections: `**bold1** text **bold2**`
- [ ] Selection from heading into paragraph
- [ ] Selection across code blocks
- [ ] Selection in tables (if supported)
- [ ] Selection with checkboxes `[ ]` and `[x]`

## Expected Behavior vs Current State

| Command | Expected Behavior | Current State | Status |
|---------|-------------------|---------------|--------|
| Shift + Down | Select line | ? | ❓ Untested |
| Cmd+Shift+Down | Select to end | ? | ❓ Untested |
| Cmd + A | Select all | ? | ❓ Untested |
| Alt + Click | Add cursor | ? | ❓ Untested |
| Cmd + D | Select word/next | ? | ❓ Untested |
| Home/End | Line start/end | ? | ❓ Untested |
| Alt + Up/Down | Move line | ? | ❓ Untested |

## Success Criteria

✅ All standard VS Code keyboard shortcuts work in Live Preview mode
✅ Selection works correctly across hidden markdown syntax
✅ Multiple cursors function as expected
✅ No conflicts between Live Preview decorations and selection
✅ Behavior matches VS Code's default text editor
✅ Both Mac and Windows/Linux keyboard layouts supported

## Priority
**Medium** - While not blocking core functionality, standard editor shortcuts are expected by users and improve editing experience.

## Estimated Effort
- Audit and testing: 4-6 hours
- Implementation of missing functions: 6-10 hours
- Edge case fixes: 4-6 hours

**Total: 14-22 hours**

## References
- [VS Code Keyboard Shortcuts](https://code.visualstudio.com/docs/configure/keybindings)
- [CodeMirror 6 Commands](https://codemirror.net/docs/ref/#commands)
- [CodeMirror 6 Default Keymap](https://github.com/codemirror/commands)
- [Replit VS Code Keymap for CodeMirror 6](https://github.com/replit/codemirror-vscode-keymap)

## Notes
- Consider using the `codemirror-vscode-keymap` package from Replit if we want 100% VS Code compatibility
- Some markdown-specific behaviors may need custom handling (e.g., selecting across hidden `**` markers)
- Test thoroughly with both keyboard and mouse selection
- Ensure accessibility features work (screen readers, keyboard-only navigation)

## Related Tasks
- Live Preview bold marker hiding (current task)
- Native VS Code search support (separate task)
- Mermaid diagram support (future task)
