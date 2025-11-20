# Task: Native VS Code Search Support

## Overview
Implement native VS Code search functionality (Cmd+F / Ctrl+F) for all three editor modes: Live Preview, Source, and Reading Mode.

## Problem Statement
Currently, users cannot use VS Code's native search widget (Cmd+F / Ctrl+F) to find text within the fabriqa markdown editor. This is a critical UX issue as search is a fundamental editor feature that users expect to work across all editors.

## Requirements

### Functional Requirements
1. **Keyboard Shortcuts**
   - `Cmd+F` (Mac) / `Ctrl+F` (Windows/Linux) - Open find widget
   - `Cmd+G` / `F3` - Find next
   - `Cmd+Shift+G` / `Shift+F3` - Find previous
   - `Cmd+H` (Mac) / `Ctrl+H` (Windows/Linux) - Open find and replace widget
   - `Esc` - Close find widget

2. **Find Features**
   - Case sensitive search toggle
   - Whole word search toggle
   - Regular expression search toggle
   - Match count display (e.g., "1 of 5")
   - Highlight all matches in the editor
   - Navigate between matches

3. **Find and Replace Features**
   - Replace current match
   - Replace all matches
   - Preview replacements before applying

### Mode-Specific Behavior

#### Live Preview Mode
- Search should work on the rendered markdown text (not the raw markdown syntax)
- Matches should highlight both in the source and preview
- When navigating to a match, cursor should jump to that position
- Search should respect the visibility of markdown elements (hidden syntax markers should not be searchable)

#### Source Mode
- Standard text search across the entire document
- Should work like any other text editor in VS Code

#### Reading Mode
- Search should work on the rendered HTML content
- Matches should be highlighted in the rendered view
- Cannot modify text, so only "Find" (not "Find and Replace")
- Consider scrolling to the matched text and highlighting it

## Technical Implementation

### Option 1: CodeMirror Built-in Search
CodeMirror 6 has a built-in search panel that can be enabled.

**Pros:**
- Already integrated with CodeMirror
- Works out of the box for Live Preview and Source modes
- Maintains cursor position and selection

**Cons:**
- Not the native VS Code search widget (different UI)
- Reading Mode would need separate implementation
- Users might prefer VS Code's familiar search interface

**Implementation:**
```typescript
import { search, searchKeymap } from '@codemirror/search';

// Add to editor extensions
const extensions = [
  search(),
  keymap.of(searchKeymap),
  // ... other extensions
];
```

### Option 2: VS Code Find Controller API
Implement VS Code's native find controller for the custom editor.

**Pros:**
- Native VS Code search experience
- Consistent with other VS Code editors
- Users are familiar with the UI

**Cons:**
- More complex implementation
- Need to bridge between webview and VS Code extension
- Requires handling communication between webview and extension

**Implementation:**
1. In the extension (`src/MarkdownEditor.ts`):
   ```typescript
   private setupFindController(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
     // Register find controller
     // Forward find requests to webview
     // Receive match updates from webview
   }
   ```

2. In the webview (`webview/main.ts`):
   ```typescript
   // Listen for find requests from extension
   window.addEventListener('message', event => {
     if (event.data.type === 'find') {
       // Perform search in CodeMirror or DOM
       // Send match results back to extension
     }
   });
   ```

3. Handle different modes:
   - Live Preview/Source: Use CodeMirror's search API
   - Reading Mode: Use DOM search with `window.find()` or custom implementation

### Recommended Approach
**Hybrid approach:**
1. Use CodeMirror's built-in search for Live Preview and Source modes
2. Implement custom search for Reading Mode using DOM search
3. Add a command palette command to toggle search panel
4. Consider adding VS Code's native find controller in a future phase

## Implementation Steps

### Phase 1: CodeMirror Search (Quick Win)
1. **Install dependencies** (already installed)
   - `@codemirror/search` - Already in package.json

2. **Enable search in Live Preview and Source modes**
   - Add search extension to CodeMirror configuration
   - Add search keymap
   - Test keyboard shortcuts work

3. **Style search panel to match VS Code theme**
   - Use VS Code CSS variables for colors
   - Ensure panel is visible and accessible

### Phase 2: Reading Mode Search
1. **Implement custom search for Reading Mode**
   - Create search overlay component
   - Use `window.find()` or custom DOM search
   - Highlight matches in the HTML content
   - Add navigation between matches

2. **Handle search widget visibility**
   - Show/hide search widget based on mode
   - Sync search state when switching modes

### Phase 3: VS Code Native Integration (Future)
1. **Implement VS Code Find Controller API**
   - Register custom editor as searchable
   - Forward find requests to webview
   - Report match results back to VS Code

2. **Test across all modes**
   - Verify search works in all three modes
   - Test mode switching preserves search state

## Files to Modify

### `/webview/main.ts`
- Add search configuration to CodeMirror extensions
- Handle search keyboard shortcuts
- Implement mode-specific search handling

### `/webview/editors/livePreviewMode.ts`
- Ensure search works with hidden markdown syntax
- Handle match highlighting

### `/webview/editors/readingMode.ts`
- Implement custom search for rendered HTML
- Create search overlay UI
- Handle match navigation

### `/src/MarkdownEditor.ts`
- (Future) Register find controller
- (Future) Forward find requests to webview

## Testing Checklist
- [ ] Test Cmd+F / Ctrl+F opens search in Live Preview mode
- [ ] Test Cmd+F / Ctrl+F opens search in Source mode
- [ ] Test Cmd+F / Ctrl+F opens search in Reading mode
- [ ] Test case sensitive search toggle
- [ ] Test whole word search toggle
- [ ] Test regex search toggle
- [ ] Test match count display
- [ ] Test navigation between matches (next/previous)
- [ ] Test search highlights all matches
- [ ] Test find and replace in Live Preview mode
- [ ] Test find and replace in Source mode
- [ ] Test search preserves state when switching modes
- [ ] Test Esc key closes search panel
- [ ] Test search panel styling matches VS Code theme

## User Stories
1. **As a user**, I want to press Cmd+F to search for text in my markdown document so that I can quickly find specific content.

2. **As a user**, I want to use regex search to find complex patterns in my markdown documents.

3. **As a user**, I want to replace text across my document using find and replace so that I can make bulk edits efficiently.

4. **As a user**, I want the search to work the same way in fabriqa editor as it does in other VS Code editors so that I have a consistent experience.

## Success Criteria
- ✅ Cmd+F / Ctrl+F opens search panel in all modes
- ✅ Search highlights all matches in the editor
- ✅ Users can navigate between matches using keyboard shortcuts
- ✅ Match count is displayed (e.g., "1 of 5")
- ✅ Search panel styling is consistent with VS Code theme
- ✅ Find and replace works in Live Preview and Source modes
- ✅ Search state is preserved when switching between modes (optional)

## Related Issues
- User request: "create a task for adding native vscode search support for all three modes in the editor"

## Priority
**High** - Search is a fundamental feature that users expect in any text editor.

## Estimated Effort
- Phase 1 (CodeMirror Search): 2-4 hours
- Phase 2 (Reading Mode Search): 4-6 hours
- Phase 3 (VS Code Native Integration): 8-12 hours

**Total: 14-22 hours**

## Notes
- CodeMirror 6 has excellent search functionality built-in - leverage it
- Reading Mode search is more complex due to rendered HTML
- Consider using `mark.js` library for highlighting matches in Reading Mode
- VS Code's native find controller API is documented but requires more research
