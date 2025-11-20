# Lezer Markdown Parser: Why Overlapping Nodes Occur

## Problem Statement

In Live Preview mode, line 13 with text `**The Three-Course Journey:**` was creating **multiple decorations at the same position**, causing rendering issues. The question was: **Why does the Lezer markdown parser create overlapping syntax nodes?**

## Root Cause: Hierarchical Tree Structure

The Lezer markdown parser creates a **hierarchical syntax tree** where parent nodes contain the full range (including delimiters) and child nodes mark specific parts. This is **by design** and follows standard tree structure principles.

### Example: `**bold**`

For the text `**bold**`, Lezer creates this tree:

```
StrongEmphasis (range: 0-8)
  ├── EmphasisMark (range: 0-2)  "**"
  ├── Text content (range: 2-6)  "bold"
  └── EmphasisMark (range: 6-8)  "**"
```

**Key insight:** The `StrongEmphasis` parent spans positions 0-8 (the entire range), while the `EmphasisMark` children ALSO cover positions 0-2 and 6-8.

## How Lezer Creates This Structure

Looking at `node_modules/@lezer/markdown/src/markdown.ts`:

### 1. Delimiter Type Definition (lines 1404-1405)

```typescript
const EmphasisUnderscore: DelimiterType = {resolve: "Emphasis", mark: "EmphasisMark"}
const EmphasisAsterisk: DelimiterType = {resolve: "Emphasis", mark: "EmphasisMark"}
```

The `mark: "EmphasisMark"` property tells Lezer to create separate `EmphasisMark` nodes for the delimiters.

### 2. Emphasis Parsing (lines 1476-1489)

```typescript
Emphasis(cx, next, start) {
  if (next != 95 && next != 42) return -1  // Check for _ or *
  let pos = start + 1
  while (cx.char(pos) == next) pos++  // Count consecutive markers
  // ... determine if can open/close ...
  return cx.append(new InlineDelimiter(
    next == 95 ? EmphasisUnderscore : EmphasisAsterisk,
    start,
    pos,
    (canOpen ? Mark.Open : Mark.None) | (canClose ? Mark.Close : Mark.None)
  ))
}
```

This creates delimiter markers for each `*` or `_` sequence.

### 3. Marker Resolution (lines 1691-1737)

```typescript
resolveMarkers(from: number) {
  // Find matching opening and closing delimiters
  // ...

  // Create marker nodes if specified
  if (open.type.mark)
    content.push(this.elt(open.type.mark, start, open.to))

  // Add content between markers
  for (let k = j + 1; k < i; k++) {
    if (this.parts[k] instanceof Element)
      content.push(this.parts[k] as Element)
  }

  // Create closing marker node
  if (close.type.mark)
    content.push(this.elt(close.type.mark, close.from, end))

  // Create parent node wrapping everything
  let element = this.elt(type, start, end, content)
  // ...
}
```

This creates:
1. `EmphasisMark` node for opening `**` (range: 0-2)
2. `EmphasisMark` node for closing `**` (range: 6-8)
3. `StrongEmphasis` parent wrapping all children (range: 0-8)

## Why This Causes Overlapping Decorations

When iterating the syntax tree with `syntaxTree().iterate()`, the iteration visits EVERY node, including both parents and children:

```typescript
syntaxTree(view.state).iterate({
  enter: (node) => {
    this.processNode(node, view, decorations, decoratedRanges);
  }
});
```

For `**bold**`, the iteration visits:

1. **StrongEmphasis** (range: 0-8) → `processNode()` may try to decorate this range
2. **EmphasisMark** (range: 0-2) → `processNode()` tries to decorate this range
3. **Text** (range: 2-6)
4. **EmphasisMark** (range: 6-8) → `processNode()` tries to decorate this range

**Problem:** Both the parent `StrongEmphasis` and child `EmphasisMark` nodes cover positions 0-2 and 6-8, so decorations are applied **twice** to the same positions!

## The Solution: Decorated Ranges Tracking

The fix is to track which ranges have already been decorated and skip duplicates:

```typescript
processNode(node: SyntaxNode, view: EditorView, decorations: Range<Decoration>[], decoratedRanges: Set<string>): void {
  const { from, to, type } = node;

  // Helper function to add decoration only if range not already decorated
  const addDecoration = (decoration: Decoration, from: number, to: number) => {
    const key = `${from}-${to}`;
    if (!decoratedRanges.has(key)) {
      decorations.push(decoration.range(from, to));
      decoratedRanges.add(key);  // ✓ Prevents duplicates
    }
  };

  // ... rest of processNode logic
}
```

This ensures each range is decorated **only once**, regardless of how many nodes cover that range.

## Why Not Change the Tree Structure?

You might wonder: "Why not make Lezer create a different tree structure?"

**Answer:** This hierarchical structure is intentional and beneficial:

1. **Semantic correctness**: The parent `StrongEmphasis` node represents the semantic meaning (this is bold text), while child `EmphasisMark` nodes represent syntax tokens
2. **Enables different processing**: You can style the entire bold region differently from just the markers
3. **Standard tree structure**: Parent nodes naturally contain their children's ranges in any tree representation
4. **Syntax highlighting**: CodeMirror's syntax highlighter uses this structure to apply different styles to markers vs content

## Comparison with Other Markdown Elements

### Headers (Why they work differently)

Headers in Lezer have TWO separate handling mechanisms in `livePreviewMode.ts`:

```typescript
case 'HeaderMark':
  // Handles just the # marks
  if (nodeText.match(/^#+\s?$/)) {
    addDecoration(hiddenDecoration, from, to);
  }
  break;

case 'ATXHeading1':
  // Also handles the # marks (redundant)
  if (nodeText.startsWith('#')) {
    const hashMatch = nodeText.match(/^(#+\s?)/);
    if (hashMatch) {
      addDecoration(hiddenDecoration, from, from + hashMatch[1].length);
    }
  }
  break;
```

Headers might work because of this redundancy, but emphasis markers only have one case handler, making the overlap more visible.

## Test File

See `dev/tree-structure-test.html` for a visual demonstration of the tree structure and overlapping nodes.

## Conclusion

The overlapping nodes are **by design** in Lezer's markdown parser. The hierarchical tree structure where parents contain children's ranges is standard and semantically correct. The proper solution is to track decorated ranges to prevent duplicates, which is exactly what the `decoratedRanges: Set<string>` fix does.

This is not a bug in Lezer—it's a feature that requires careful handling when applying decorations based on the syntax tree.
