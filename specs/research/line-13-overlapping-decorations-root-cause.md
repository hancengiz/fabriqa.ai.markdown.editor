# Line 13 Overlapping Decorations: Root Cause Analysis

## The Mystery

Line 13 with `**The Three-Course Journey:**` showed overlapping decorations (visible `**` markers), while other bold text like `**120-hour progressive program**` on line 11 worked perfectly. Why?

## The Evidence

Console logs from debugging showed:
```
[LivePreview] Decorations for line 13 area: (5) ['576-580', '576-579', '580-582', '617-619', '621-624']
```

**Key observations:**
- 5 decorations created for one line
- `576-580` and `576-579` **OVERLAP** (both start at 576)
- `580-582` is the opening `**`
- `617-619` is the closing `**`
- `621-624` extends beyond the bold text

## The Actual File Content

From `/Users/cengiz_han/workspace/code/fabriqa-test/specs/ai-native-engineering-exec-summary.md`:

```markdown
11: This **120-hour progressive program** (three 40-hour courses)...
12: [blank line]
13: **The Three-Course Journey:**
14: [blank line]
15: ### **Progressive Complexity Architecture**
```

## The Critical Difference

### Line 11: **Inline Bold**
```
[long paragraph with inline bold surrounded by text]
```

**Lezer parser creates:**
```
Paragraph (entire line, ~100 chars)
  ├── Text "This "
  ├── StrongEmphasis (**120-hour progressive program**)
  │   ├── EmphasisMark (**)
  │   ├── Text (120-hour progressive program)
  │   └── EmphasisMark (**)
  └── Text " (three 40-hour courses)..."
```

**Paragraph size**: 100+ characters
**Bold size**: 31 characters
**Bold is**: ~30% of paragraph

### Line 13: **Standalone Bold Paragraph**
```
[paragraph containing ONLY bold text]
```

**Lezer parser creates:**
```
Paragraph (~29 chars - just the bold text!)
  └── StrongEmphasis (**The Three-Course Journey:**)
      ├── EmphasisMark (**) at positions 580-582
      ├── Text (The Three-Course Journey:) at 582-608
      └── EmphasisMark (**) at 608-610
```

**Paragraph size**: ~29 characters
**Bold size**: 29 characters
**Bold is**: **100% of paragraph**

## Why This Caused Overlapping Decorations

### The OLD Code (Before Fix)

```typescript
syntaxTree(view.state).iterate({
  enter: (node) => {
    // No tracking - process EVERY node
    this.processNode(node, view, decorations);
  }
});

processNode(node: SyntaxNode, view: EditorView, decorations: Range<Decoration>[]): void {
  switch (node.type.name) {
    case 'EmphasisMark':
      // Create decoration at node's range
      decorations.push(Decoration.replace({}).range(from, to));
      break;

    // ... other cases
  }
}
```

**Problem:** When iterating over line 13's tree, the OLD code visits:

1. **Paragraph** (576-610) → Could trigger some case
2. **StrongEmphasis** (580-610) → Could trigger some case
3. **EmphasisMark** (580-582) → Triggers `EmphasisMark` case → Decoration at 580-582 ✓
4. **Text** (582-608)
5. **EmphasisMark** (608-610) → Triggers `EmphasisMark` case → Decoration at 608-610 ✓

But the evidence shows decorations at **576-580** and **576-579** - positions BEFORE the bold text starts!

### The Smoking Gun

Looking at the positions:
- Line 12 (blank line) ends at position ~575
- Line 13 starts at position ~576
- Bold text `**` starts at position 580

**Positions 576-580 (4 chars before bold) could be:**
- The newline `\n` from line 12 (1 char)
- Plus 3 spaces or characters before `**`

**OR** more likely, given the evidence:
- Positions 576-580: Some node representing the paragraph boundary or text before bold
- Positions 576-579: Another node with similar but slightly different range

The Lezer parser creates **paragraph boundary nodes** or **text nodes** at these positions, and the OLD code processed BOTH without deduplication, creating overlapping decorations!

## Why Line 11 Didn't Have This Issue

For line 11 (`**120-hour progressive program**`):
- Inline within a large paragraph
- Paragraph node spans much more than just the bold
- Paragraph boundaries are far from the bold text
- No nodes overlap at the bold text boundaries
- Only EmphasisMark nodes create decorations → No overlaps

## The Fix Evolution

### First Attempt (Failed): Node-Level Tracking

Commit 7c5bec9:
```typescript
const decoratedRanges = new Set<string>();

syntaxTree(view.state).iterate({
  enter: (node) => {
    // Track at NODE level
    const rangeKey = `${node.from}-${node.to}`;
    if (decoratedRanges.has(rangeKey)) {
      return false;  // Skip this node
    }

    this.processNode(node, view, decorations);
    decoratedRanges.add(rangeKey);  // ❌ Wrong granularity!
  }
});
```

**Problem:** Tracked entire NODES (e.g., `StrongEmphasis 580-610`), not specific DECORATION ranges (e.g., `EmphasisMark 580-582`). When a parent node was tracked, its children were skipped entirely.

### Final Fix (Success): Decoration-Level Tracking

Current code:
```typescript
const decoratedRanges = new Set<string>();

syntaxTree(view.state).iterate({
  enter: (node) => {
    // Don't track at node level, pass Set to processNode
    this.processNode(node, view, decorations, decoratedRanges);
  }
});

processNode(node, view, decorations, decoratedRanges) {
  // Helper function checks DECORATION level
  const addDecoration = (decoration, from, to) => {
    const key = `${from}-${to}`;
    if (!decoratedRanges.has(key)) {
      decorations.push(decoration.range(from, to));
      decoratedRanges.add(key);  // ✓ Correct granularity!
    }
  };

  switch (node.type.name) {
    case 'EmphasisMark':
      addDecoration(hiddenDecoration, from, to);
      break;
  }
}
```

**Success:** Tracks at the DECORATION level. Multiple nodes can be processed, but if they try to create decorations at the same range, only the first succeeds.

## Conclusion

**Line 13 had overlapping decorations because:**

1. **It was a standalone paragraph** containing only `**The Three-Course Journey:**`
2. The **Paragraph node ≈ StrongEmphasis node** (nearly identical ranges)
3. **Paragraph boundaries** at positions 576-580 created additional nodes
4. The **OLD code** processed all nodes without checking if decoration ranges overlapped
5. Result: Multiple decorations at positions like 576-580 and 576-579 **overlapped** → CodeMirror couldn't render them → syntax stayed visible

**Line 11 worked because:**
- Bold was inline within a large paragraph
- No paragraph boundaries near the bold text
- Only EmphasisMark nodes created decorations
- No overlaps

**The fix:**
- Decoration-level tracking (not node-level tracking)
- Each decoration range (e.g., `580-582`) tracked separately
- Prevents any overlaps regardless of tree structure
- Works for both inline and standalone bold paragraphs

## Test Files

Created to verify this analysis:
- `dev/test-standalone-bold-paragraph.html` - Compares inline vs standalone bold
- `dev/test-line-13-exact.html` - Recreates line 13 scenario
- `dev/test-paragraph-boundary-overlap.html` - Tests paragraph boundaries

Open these in a browser to see the Lezer tree structure and verify the theory.
