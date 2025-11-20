# Simple Explanation: Why Line 13 Had the Bug

## The Two Lines

**Line 11 (worked fine):**
```
This **120-hour progressive program** is a long sentence with text before and after the bold
```

**Line 13 (had bug):**
```
**The Three-Course Journey:**
```

## What's Different?

Line 13 is **ONLY** bold text. Nothing before it, nothing after it (on that line).

## What the OLD Code Did Wrong

The OLD code would visit EVERY node in the syntax tree and try to hide syntax.

For line 13, when it visited the nodes, it found:
- A Paragraph node
- A StrongEmphasis node
- EmphasisMark nodes for the `**`

**The problem:** Some of these nodes had the **SAME positions** or **overlapping positions**.

Example:
```
Node 1: Paragraph       from position 576 to 610
Node 2: StrongEmphasis  from position 580 to 610
Node 3: EmphasisMark    from position 580 to 582 (the opening **)
```

The OLD code would try to create decorations for ALL of them:
```typescript
// Visit Node 1 (Paragraph)
processNode() → creates decoration at 576-610

// Visit Node 2 (StrongEmphasis)
processNode() → creates decoration at 580-610

// Visit Node 3 (EmphasisMark)
processNode() → creates decoration at 580-582
```

**Result:** Positions 580-610 have **TWO decorations** (from Node 2 and Node 3)!

CodeMirror says: "Wait, you're trying to decorate the same position twice? I can't do that!"
→ Decorations fail
→ The `**` markers stay visible

## Why Line 11 Was Fine

Line 11 had text AROUND the bold:
```
"This " + **120-hour...** + " is a long sentence"
```

So the Paragraph node was MUCH BIGGER than the StrongEmphasis node:
```
Paragraph:       position 0 to 100 (the whole sentence)
StrongEmphasis:  position 5 to 35 (just the bold part)
```

No overlap! Each node had different positions, so no problem.

## The Fix

The NEW code checks: "Did I already decorate this position?"

```typescript
const decoratedRanges = new Set();

function addDecoration(from, to) {
  const key = `${from}-${to}`;
  if (!decoratedRanges.has(key)) {  // ← Check first!
    decorations.push(...);
    decoratedRanges.add(key);
  }
}
```

Now for line 13:
```
Visit Node 1 → Try to decorate 576-610 → ✓ OK, added
Visit Node 2 → Try to decorate 580-610 → ✓ OK, added
Visit Node 3 → Try to decorate 580-582 → ✓ OK, added
```

No duplicates = No overlaps = Works! ✅

## Summary

- **Line 13** = 100% bold text = Nodes have same/overlapping positions = OLD code decorated same positions twice = Bug
- **Line 11** = Bold mixed with text = Nodes have different positions = OLD code never decorated same positions = No bug
- **The Fix** = Check "already decorated?" before decorating = No duplicates = Always works
