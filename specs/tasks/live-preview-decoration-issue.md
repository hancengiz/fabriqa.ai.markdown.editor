# Issue: Live Preview Decorations Not Hiding Markdown Syntax

## Problem Statement
Live Preview mode is intended to hide markdown syntax markers (like `**` for bold) except when the cursor is actively editing that element (Obsidian-style). However, `**` markers and other syntax remain visible even when they should be hidden.

## Current Status
- ❌ **Bold markers `**` remain visible** in Live Preview mode
- ✅ **Bold text IS rendered as bold** (styling works)
- ✅ **Heading markers `#` are successfully hidden**
- ✅ **Reading Mode works perfectly** (uses marked.js, not decorations)
- ❌ **`Decoration.replace()` doesn't hide the markers**

## Investigation Results

### What Was Tested

1. **Basic `Decoration.replace({})`**
   - Result: Decorations created but markers still visible
   - 18-22 decorations created per document
   - Confirmed via console logging

2. **`Decoration.mark()` with CSS hiding**
   - CSS: `display: none; font-size: 0; visibility: hidden;`
   - Result: Markers still visible

3. **`Prec.highest()` for maximum precedence**
   - Result: Broke markdown syntax highlighting entirely
   - Heading `#` became visible, heading styling broke
   - Made the problem worse

4. **Disabling decorations completely**
   - Result: Markdown renders correctly with visible markers
   - Confirms decorations conflict with syntax highlighter

### Root Cause

**CodeMirror's decoration system conflicts with the markdown syntax highlighter.**

When both systems are active:
- Syntax highlighter paints markdown tokens (including `**` markers)
- Our decorations try to hide those same tokens
- The syntax highlighter's rendering takes precedence
- `Decoration.replace()` doesn't actually remove the text from view

### Why Heading Markers (`#`) Work

Looking at the code in `livePreviewMode.ts:338-375`, there are TWO separate mechanisms for hiding heading markers:

```typescript
case 'HeaderMark':
  // Hide header marks (# ## ### etc.)
  if (nodeText.match(/^#+\s?$/)) {
    decorations.push(
      Decoration.replace({ inclusive: false }).range(from, to)
    );
  }
  break;

case 'ATXHeading1':
// ... (similar for H2-H6)
  // Hide header marks at the start
  if (nodeText.startsWith('#')) {
    const hashMatch = nodeText.match(/^(#+\s?)/);
    if (hashMatch) {
      decorations.push(
        Decoration.replace({ inclusive: false }).range(from, from + hashMatch[1].length)
      );
    }
  }
  break;
```

This redundant handling might be why heading markers work - the markdown parser may treat them differently than emphasis marks.

### Why Bold Markers (`**`) Don't Work

```typescript
case 'EmphasisMark':
  // Hide emphasis marks (*, **, _, __) - matches any combination
  if (nodeText.match(/^[*_]+$/)) {
    decorations.push(
      Decoration.replace({}).range(from, to)
    );
  }
  break;
```

The same approach doesn't work for `EmphasisMark` tokens. Possible reasons:
1. Markdown syntax highlighter renders these differently
2. The token positions don't align with what `Decoration.replace()` expects
3. Emphasis marks are part of a larger styled span that can't be partially hidden

## Alternative Approaches

### Option 1: Custom Markdown Extension (Recommended)
Instead of trying to hide syntax after parsing, modify how CodeMirror's markdown extension renders it.

**Approach:**
- Create a custom markdown language configuration
- Configure the Lezer parser to omit syntax tokens from the syntax tree
- Or mark them as invisible during parsing

**Pros:**
- Works with the parser, not against it
- More reliable and performant
- Proper integration with syntax highlighting

**Cons:**
- More complex implementation
- Requires deep CodeMirror knowledge
- May need to fork `@codemirror/lang-markdown`

**Effort:** 15-20 hours

### Option 2: CSS-Based Hiding
Use CodeMirror's theme system to hide syntax via CSS classes.

**Approach:**
```typescript
EditorView.baseTheme({
  '.cm-formatting-emphasis': {
    display: 'none !important'
  },
  // Show when active
  '.cm-activeLine .cm-formatting-emphasis': {
    display: 'inline !important'
  }
})
```

**Pros:**
- Simple to implement
- No conflict with decorations
- Fast performance

**Cons:**
- Less granular control (line-level, not element-level)
- May hide syntax on entire line, not just inactive elements
- Harder to achieve Obsidian-style per-element behavior

**Effort:** 2-4 hours

### Option 3: Alternative Editor Mode
Accept visible markers as a tradeoff for Live Preview mode.

**Approach:**
- Keep current implementation
- Document that markers are visible
- Focus on other features (checkboxes, links work great!)
- Users can use Reading Mode for clean preview

**Pros:**
- Zero effort, works now
- Reading Mode provides full preview
- Many markdown editors show markers

**Cons:**
- Not true "Live Preview" experience
- Doesn't match Obsidian behavior
- User reported it as a bug/issue

**Effort:** 0 hours (accept limitation)

### Option 4: Switch to Different Markdown Library
Replace `@codemirror/lang-markdown` with a custom solution.

**Approach:**
- Use marked.js (like Reading Mode) for parsing
- Render to invisible layer
- Overlay decorations for interactive elements
- Hybrid approach

**Pros:**
- Full control over rendering
- Can achieve exact Obsidian behavior
- Reuse existing marked.js integration

**Cons:**
- Very complex implementation
- Performance concerns (double rendering)
- Lose CodeMirror's markdown features (folding, etc.)

**Effort:** 30-40 hours

## Recommended Path Forward

**Short-term (Now):**
- Accept Option 3 - keep current behavior
- Document that markers are visible in Live Preview
- Reading Mode provides full clean preview
- Focus on other high-value features

**Medium-term (Later):**
- Implement Option 2 (CSS-based) for line-level hiding
- Provides some improvement with minimal effort
- Better than nothing

**Long-term (Future):**
- Investigate Option 1 (Custom markdown extension)
- Proper solution but requires significant effort
- Consider only if this becomes a major user complaint

## Workarounds for Users

1. **Use Reading Mode** (Cmd+Shift+R) for clean preview
2. **Use Source Mode** (Cmd+Shift+S) for full markdown visibility
3. **Toggle between modes** as needed while editing

## Related Files
- `/webview/editors/livePreviewMode.ts` - Current implementation
- `/webview/editors/readingMode.ts` - Working example with marked.js
- `/webview/main.ts` - Mode switching logic

## Testing Evidence

During investigation, console logs confirmed:
```
[LivePreview] StrongEmphasis at line 13: "**The Three-Course Journey:**" (xxx-yyy)
[LivePreview] EmphasisMark at line 13: "**" (xxx-xxx)
[LivePreview] Creating decoration to hide EmphasisMark "**" at line 13 (xxx-xxx)
[LivePreview] Returning 18 decorations
```

- Parser correctly identifies markers ✅
- Decorations are created ✅
- Decorations don't hide the markers ❌

## Conclusion

This is a known limitation of CodeMirror 6's decoration system when combined with syntax highlighting. A proper fix requires either:
- Changing how markdown is parsed (Option 1)
- Accepting line-level hiding via CSS (Option 2)
- Accepting visible markers (Option 3)

For now, Option 3 is recommended while we focus on higher-priority features.
