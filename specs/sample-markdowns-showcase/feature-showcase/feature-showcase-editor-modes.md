# Editor Modes

This demonstrates the three editing modes available in fabriqa.ai markdown editor.

---

## 1. Live Preview Mode (Cmd+Shift+P)

**Obsidian-style live preview with intelligent syntax hiding**

### Features
- Edit and see rendered output simultaneously
- Syntax hides when not actively editing
- Click or move cursor to any element to see its raw markdown
- Seamless transition between editing and viewing

### When to Use
- Writing and formatting content
- Quick edits while seeing the result
- Most common editing mode
- Best for active document creation

### Behavior
- **Images**: Show markdown when cursor is inside, rendered when outside
- **Links**: Clickable with Cmd+Click when not editing
- **Checkboxes**: Clickable when cursor is not on that line
- **Mermaid**: Diagram visible when cursor is outside, code when inside
- **Formatting**: Syntax appears only when cursor is in that element

---

## 2. Source Mode (Cmd+Shift+S)

**Traditional markdown editor with full syntax visibility**

### Features
- Raw markdown editing
- All syntax always visible
- Traditional text editor experience
- Full control over markdown source

### When to Use
- Detailed markdown editing
- Learning markdown syntax
- Precise formatting control
- Copying markdown source
- Troubleshooting formatting issues

### Behavior
- All markdown syntax visible at all times
- No decorations or widgets
- Plain text editing
- Standard text editor controls

---

## 3. Reading Mode (Cmd+Shift+R)

**Distraction-free reading experience**

### Features
- Read-only rendered view
- Clean, polished appearance
- No editing capabilities
- Full markdown rendering

### When to Use
- Reading documentation
- Presenting content
- Reviewing final output
- Distraction-free reading

### Behavior
- Cannot edit text
- All features fully rendered
- Links clickable
- Checkboxes clickable
- Mermaid diagrams interactive
- Images displayed
- Perfect rendering

---

## Mode Comparison

| Feature                     | Live Preview    | Source             | Reading     |
| ------------------- | --------------- | -------------- | ----------- |
| Edit Text                   | ✅ Yes              | ✅ Yes             | ❌ No         |
| See Formatting        | ✅ Yes              | ❌ No              | ✅ Yes       |
| Syntax Visible          | 🔄 Contextual | ✅ Always       | ❌ Never   |
| Click Checkboxes   | ✅ Yes              | ❌ No              | ✅ Yes       |
| Cmd+Click Links     | ✅ Yes              | ❌ No              | ✅ Yes       |
| Mermaid Diagrams | 🔄 Contextual | ❌ Code Only | ✅ Always |
| Best For                   | Writing             | Source Edit      | Reading     |

---

## Keyboard Shortcuts

Switch between modes instantly:

- **Cmd+Shift+P** - Live Preview Mode
- **Cmd+Shift+S** - Source Mode
- **Cmd+Shift+R** - Reading Mode

---

## Tips

- **Start with Live Preview** for most editing tasks
- **Use Source Mode** when you need full control
- **Switch to Reading Mode** to see the final result
- **Keyboard shortcuts** make switching seamless
- **Each mode** has its place in the workflow

---

*Part of fabriqa.ai markdown editor Feature Showcase*
