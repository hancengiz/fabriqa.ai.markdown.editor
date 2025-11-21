# Tables

This demonstrates table functionality and editing in markdown.

---

## Basic Table

| Feature | Status | Priority |
|---------|--------|----------|
| Live Preview | ✅ Complete | High |
| Source Mode | ✅ Complete | High |
| Reading Mode | ✅ Complete | Medium |
| GitHub Alerts | ✅ Complete | High |
| Image Rendering | ✅ Complete | High |
| Horizontal Rules | ✅ Complete | Low |
| Mermaid Diagrams | ✅ Complete | Medium |

---

## Table with Different Alignments

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Text | Text | Text |
| More text | More text | More text |
| Even more | Even more | Even more |

---

## Complex Table

| Category | Feature | Description | Status |
|----------|---------|-------------|--------|
| Editing | Live Preview | Obsidian-style editing | ✅ |
| Editing | Source Mode | Raw markdown | ✅ |
| Editing | Reading Mode | Read-only view | ✅ |
| Formatting | **Bold** | Bold text | ✅ |
| Formatting | *Italic* | Italic text | ✅ |
| Formatting | `Code` | Inline code | ✅ |

---

## Table Editing Features

### Navigation
- **Tab**: Move to next cell
- **Shift+Tab**: Move to previous cell
- Automatic wrapping at row boundaries

### Row Operations
- **Cmd+Shift+↑**: Insert row above
- **Cmd+Shift+↓**: Insert row below
- **Cmd+Shift+D**: Delete current row

### Column Operations
- **Cmd+Shift+←**: Insert column left
- **Cmd+Shift+→**: Insert column right
- **Cmd+Shift+Backspace**: Delete current column

### Formatting
- **Cmd+Shift+F**: Format table (align columns)
- Preserves header and separator rows
- Automatic cell alignment

---

## Creating Tables

Use **Cmd+Shift+T** to insert a new table:
- Default: 3 rows × 3 columns
- Includes header and separator
- Ready for content entry

---

## Syntax

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

With alignment:
```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L    | C      | R     |
```

---

*Part of fabriqa.ai markdown editor Feature Showcase*
