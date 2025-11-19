# Markdown Editor Research for VS Code Extension

**Research Date**: November 19, 2025
**Objective**: Find open source markdown editor solutions for building an Obsidian-like editing experience in VS Code

---

## Executive Summary

Obsidian's markdown editor is built on **CodeMirror 6** and **HyperMD** (both MIT licensed). The key feature - "Live Preview" mode where cursor position reveals markdown syntax - is **NOT supported by Milkdown** despite it being WYSIWYG. For true Obsidian-like behavior, **CodeMirror 6 with custom extensions** is the recommended approach.

---

## How Obsidian's Editor Works

### Technology Stack

| Component | License | Purpose |
|-----------|---------|---------|
| **CodeMirror 6** | MIT | Core text editor framework |
| **HyperMD** | MIT | WYSIWYG markdown extensions |
| **@lezer/markdown** | MIT | Markdown parser (AST) |
| **@codemirror packages** | MIT | Language support, autocomplete, commands, etc. |

### Editing Modes

#### 1. Reading Mode
- Fully rendered HTML preview
- No editing interface
- Clean document view

#### 2. Live Preview Mode (The Key Feature)
- **Hybrid editing/preview experience**
- Shows raw markdown syntax **only for the line with cursor**
- All other content rendered as formatted output
- Click on formatted text → cursor moves there → syntax reveals
- Move cursor away → returns to formatted view

#### 3. Source Mode
- Raw markdown with syntax highlighting
- All syntax visible at all times
- Traditional code editor experience

### Technical Implementation of Live Preview

1. **Markdown Parsing**: Uses `@lezer/markdown` to parse into AST
2. **Selective Rendering**:
   - Hides markdown tokens when cursor is not in element
   - Shows raw syntax for active line
   - Renders everything else as formatted output
3. **Widget Decorations & View Plugins**:
   - CodeMirror 6's Decoration system controls visual appearance
   - ViewPlugin iterates syntax tree and maintains decoration sets
   - Markdown marks hidden or nodes replaced with custom widgets
4. **Cursor-Based Toggle**:
   - Cursor position triggers syntax visibility
   - Not click-based - cursor location determines behavior

---

## Open Source Editor Library Analysis

### Option 1: Milkdown ⚠️

**GitHub**: https://github.com/Milkdown/milkdown
**License**: MIT
**Built On**: ProseMirror + Remark

#### Features
- Plugin-driven WYSIWYG framework
- TypeScript-based, modular architecture
- Existing VS Code extension available
- Production-ready and well-documented

#### Editing Behavior
- **Pure WYSIWYG** (like Google Docs or Notion)
- **NEVER shows markdown syntax**
- Cursor position does NOT reveal syntax
- No Live Preview mode
- No source mode toggle (by default)

#### VS Code Integration
- **High** - Already has VS Code extension
- Custom Editor API compatible
- Easy to embed in webviews

#### Obsidian-Like Feel
- **POOR** for Live Preview behavior
- **EXCELLENT** for pure WYSIWYG
- Does NOT support cursor-based syntax revealing

#### Verdict
❌ **NOT SUITABLE** for Obsidian-like "reveal syntax on cursor" behavior
✅ **SUITABLE** for pure WYSIWYG editing if that's acceptable

---

### Option 2: CodeMirror 6 + Extensions ⭐ RECOMMENDED

**GitHub**:
- https://github.com/codemirror/codemirror6
- https://github.com/laobubu/HyperMD
- https://codeberg.org/retronav/ixora

**License**: MIT
**Architecture**: State-based with transactions

#### Features
- Exact same stack as Obsidian
- Highly extensible and performant
- Official `@codemirror/lang-markdown` package
- HyperMD provides WYSIWYG components
- Ixora extension pack for interactive editing

#### Editing Behavior
- **Fully customizable**
- Can implement Live Preview with cursor-based syntax revealing
- Supports all three modes (Reading, Live Preview, Source)
- Token hiding via decorations and CSS

#### VS Code Integration
- **Moderate** - Requires webview embedding
- Must use Custom Editor API
- More manual work than Milkdown
- Proven viable by Obsidian

#### Obsidian-Like Feel
- **EXCELLENT** - Can achieve identical behavior
- Same technology, same capabilities
- Requires building custom view plugins

#### Verdict
✅ **RECOMMENDED** for authentic Obsidian experience
⚠️ Requires more development effort

---

### Option 3: Toast UI Editor

**GitHub**: https://github.com/nhn/tui.editor
**License**: MIT
**Built On**: ProseMirror (v3.0+)

#### Features
- Mature, production-ready
- GFM (GitHub Flavored Markdown) support
- Dual mode: WYSIWYG + Markdown
- Chart and UML extensions
- Scroll sync between modes

#### Editing Behavior
- **Mode switching** (toggle between WYSIWYG and source)
- NOT cursor-based revealing
- More like traditional split/toggle editor

#### VS Code Integration
- **High** - Multiple existing extensions use it
- Well-documented API
- Easy webview embedding

#### Obsidian-Like Feel
- **MODERATE** - Different UX paradigm
- Requires explicit mode switching
- Not seamless inline editing

#### Verdict
⚠️ Different editing pattern than Obsidian
✅ Good for traditional markdown editing

---

### Option 4: ProseMirror

**GitHub**: https://github.com/ProseMirror/prosemirror-markdown
**License**: MIT
**Type**: Low-level framework

#### Features
- Well-behaved rich semantic editor
- prosemirror-markdown for conversion
- Collaborative editing support
- Custom document schemas

#### Editing Behavior
- **Pure WYSIWYG** by default
- Requires significant custom work for Live Preview
- Very flexible but low-level

#### VS Code Integration
- **Moderate-Low** - Requires substantial setup
- Used by some extensions
- More work than higher-level frameworks

#### Obsidian-Like Feel
- **MODERATE** - Can be built but requires effort
- Framework, not complete solution

#### Verdict
⚠️ Too low-level for quick implementation
✅ Maximum flexibility if building from scratch

---

### Option 5: Zettlr

**GitHub**: https://github.com/Zettlr/Zettlr
**License**: MIT (GPL for app)
**Type**: Desktop application

#### Features
- "Pseudo-WYSIWYG mode"
- Hides formatting unless cursor inside
- Full desktop markdown editor

#### Editing Behavior
- **Cursor-based syntax revealing** ✓
- Similar to Obsidian's Live Preview
- Open source implementation available

#### VS Code Integration
- **Low** - Desktop app, not a library
- Would need to extract editor component
- Not designed for embedding

#### Obsidian-Like Feel
- **EXCELLENT** - Very similar behavior
- Proven implementation

#### Verdict
⚠️ Not packaged as reusable library
✅ Good reference implementation

---

### Option 6: MarkText / Muya

**GitHub**: https://github.com/marktext/muya
**License**: MIT
**Type**: Browser-based library

#### Features
- Core editor from MarkText app
- Block-based architecture
- Real-time WYSIWYG preview
- CommonMark and GFM support

#### Editing Behavior
- **Inline editing** of formatted text
- Block-based structure
- Document-centric approach

#### VS Code Integration
- **Moderate** - Can embed in webviews
- Still in development
- Available as `@muyajs/core` on npm

#### Obsidian-Like Feel
- **EXCELLENT** - Similar to Typora/Obsidian
- True inline editing

#### Verdict
⚠️ Still under development, not production-ready
✅ Promising for future

---

## Key Research Findings

### The "Live Preview" Pattern

**What It Is**:
- Cursor position determines syntax visibility
- Active line shows raw markdown (`**bold**`, `_italic_`)
- Other lines show formatted output
- NOT click-based - cursor-based

**What It's Called**:
- "Live Preview" (Obsidian)
- "WYSIWYM" (What You See Is What You Mean)
- "Pseudo-WYSIWYG" (Zettlr)
- "Cursor-based syntax revealing"
- "Hybrid editing mode"

**Who Supports It**:
- ✅ Obsidian (CodeMirror 6)
- ✅ Zettlr (custom implementation)
- ✅ MarkText (Muya library)
- ✅ Typora (proprietary)
- ✅ CodeMirror 6 + codemirror-rich-markdoc plugin
- ❌ Milkdown (pure WYSIWYG)
- ❌ Toast UI (mode switching)
- ❌ Standard ProseMirror (WYSIWYG only)

---

## Comparison Matrix

| Feature | Milkdown | CodeMirror 6 | Toast UI | ProseMirror | Muya |
|---------|----------|--------------|----------|-------------|------|
| **Live Preview** | ❌ No | ✅ Yes (custom) | ❌ No | ❌ No (default) | ✅ Yes |
| **Pure WYSIWYG** | ✅ Yes | ⚠️ Optional | ✅ Yes | ✅ Yes | ❌ No |
| **Source Mode** | ❌ No (default) | ✅ Yes | ✅ Yes | ⚠️ Custom | ✅ Yes |
| **VS Code Integration** | High | Moderate | High | Moderate | Moderate |
| **Obsidian Feel** | Poor | Excellent | Moderate | Moderate | Excellent |
| **Maturity** | Mature | Very Mature | Very Mature | Very Mature | Beta |
| **License** | MIT | MIT | MIT | MIT | MIT |
| **TypeScript** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Recommendations

### For Obsidian-Like Live Preview
**Use CodeMirror 6** because:
1. Same technology as Obsidian
2. Proven in production
3. Supports cursor-based syntax revealing
4. Full control over editing behavior
5. Excellent documentation and ecosystem

**Implementation Path**:
- Start with `@codemirror/lang-markdown`
- Study `codemirror-rich-markdoc` plugin
- Build custom ViewPlugin for cursor-based decorations
- Implement StateField for tracking cursor position
- Use Decoration API to hide/show markdown tokens

### For Quick WYSIWYG (No Live Preview)
**Use Milkdown** if:
- Pure WYSIWYG is acceptable
- Don't need cursor-based syntax revealing
- Want fastest integration path
- Existing VS Code extension provides reference

### For Traditional Split-Pane
**Use Toast UI Editor** if:
- Separate preview/edit modes are acceptable
- Want battle-tested, production-ready solution
- Need GFM and extensions (charts, UML)

---

## Technical Implementation Notes

### CodeMirror 6 Live Preview Architecture

1. **State Management**:
   ```typescript
   const cursorPosition = EditorState.field({
     create: () => 0,
     update: (pos, transaction) => transaction.selection.main.head
   });
   ```

2. **Decoration System**:
   - `Decoration.mark()` - Hide markdown tokens via CSS
   - `Decoration.widget()` - Insert rendered elements
   - `Decoration.replace()` - Replace syntax with formatted view

3. **View Plugin Pattern**:
   ```typescript
   ViewPlugin.fromClass(class {
     update(update) {
       // Check cursor position
       // Rebuild decorations for visible range
       // Show syntax for active line
       // Hide syntax for other lines
     }
   })
   ```

4. **Token Hiding Technique**:
   ```css
   .cm-markdown-hidden {
     font-size: 1px;
     letter-spacing: -1ch;
   }
   ```

### VS Code Custom Editor API

For any editor choice, integration requires:
1. **WebviewPanel** or **CustomTextEditor**
2. **Message passing** between webview and extension
3. **File system integration** for loading/saving
4. **Synchronization** between VS Code document and editor state

---

## References

- [Obsidian Community Discussions on CodeMirror 6](https://forum.obsidian.md/)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [HyperMD GitHub Repository](https://github.com/laobubu/HyperMD)
- [codemirror-rich-markdoc Plugin](https://github.com/benrbray/prosemirror-remark-schema)
- [Milkdown Documentation](https://milkdown.dev/)
- [VS Code Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)

---

## Collaborative Commenting Systems Research

**Research Date**: November 19, 2025
**Objective**: Identify open source commenting/annotation libraries compatible with CodeMirror 6 and markdown editors

### Executive Summary

Researched 20+ open source commenting systems for integration with CodeMirror 6. Solutions range from lightweight text annotations to full collaborative editing frameworks. **Recommended approach**: Start with CodeMirror 6 decorations + W3C annotation model, scale to Yjs for real-time collaboration later.

---

### Top Recommendations

#### 🥇 Best Overall: Yjs + y-codemirror.next + Custom Comments
- **GitHub**: https://github.com/yjs/y-codemirror.next (186 stars)
- **Parent**: https://github.com/yjs/yjs (20,600+ stars)
- **License**: MIT
- **Status**: ✅ Active (v0.3.5, June 2024)

**Features**:
- Real-time collaborative editing (CRDT)
- Shared cursors and selections
- Individual undo/redo
- Network-agnostic
- Excellent CM6 integration

**For Commenting**:
- Comments can be stored in Y.Map/Y.Array
- Real-time sync across clients
- Relative position anchoring

**Integration**: Medium (requires backend)
**Effort**: 4-6 weeks full implementation

**Verdict**: ✅ **Best for production apps with real-time collaboration**

---

#### 🥈 Easiest Integration: CodeMirror 6 Decorations + Recogito
- **CM6 Decorations**: https://codemirror.net/examples/decoration/
- **Recogito**: https://github.com/recogito/text-annotator-js (51 stars)
- **License**: Native CM6 (MIT) + BSD-3-Clause (Recogito)
- **Status**: ✅ Active

**Features**:
- Native CM6 widget decorations for comment markers
- Recogito for annotation data model
- Event-driven lifecycle
- Configurable styling
- React wrapper available

**For Commenting**:
- Visual comment indicators in editor
- Text selection anchoring
- Custom annotation storage

**Integration**: Low-Medium
**Effort**: 2-3 weeks

**Verdict**: ✅ **Best for quick implementation without real-time**

---

#### 🥉 Reference Implementation: TipTap Comment Extension
- **GitHub**: https://github.com/sereneinserenade/tiptap-comment-extension (470 stars)
- **License**: MIT
- **Status**: ⚠️ Last update Sept 2023
- **Language**: TypeScript (81.6%)

**Features**:
- Google Docs-style commenting
- `setComment` / `unsetComment` commands
- Comment activation callbacks
- TypeScript support
- Thread support

**Note**: Built for ProseMirror, not CodeMirror
**Use Case**: Study architecture, port concepts to CM6

**Integration**: High (requires porting)
**Effort**: 3-4 weeks to adapt

**Verdict**: ⚠️ **Excellent reference, but needs adaptation**

---

### Detailed Analysis

#### 1. Apache Annotator (W3C Standards)
- **GitHub**: https://github.com/apache/incubator-annotator (240 stars)
- **License**: Apache 2.0
- **Status**: ⚠️ Archived (Aug 2025)
- **Language**: TypeScript (88.5%)

**Features**:
- W3C Web Annotation standard
- Text fragment anchoring
- Selector-based mapping
- Framework-agnostic

**Pros**: Standards-based, well-architected
**Cons**: Archived, requires custom UI

**Recommendation**: Use data model, not implementation

---

#### 2. Annotator.js (Legacy)
- **GitHub**: https://github.com/openannotation/annotator (2,700 stars)
- **License**: MIT/GPL-3.0
- **Status**: ⚠️ Maintenance mode (last release 2015)

**Features**:
- Complete annotation UI
- Server persistence
- Plugin architecture
- User authorization

**Pros**: Battle-tested, extensive plugins
**Cons**: Outdated, pre-ES6

**Recommendation**: ❌ Too old for new projects

---

#### 3. react-comments-section
- **GitHub**: https://github.com/RiyaNegi/react-comments-section (178 stars)
- **License**: MIT
- **Status**: ✅ Active
- **Language**: TypeScript (85.7%)

**Features**:
- Thread replies
- Edit/delete comments
- Rich text editor option
- Social media-style UI
- Easy React integration

**Pros**: Full-featured, TypeScript, easy setup
**Cons**: React-only, NOT text-anchored (general comments)

**Recommendation**: ⚠️ Good for general commenting sidebar, not inline annotations

---

#### 4. Lexical Comments
- **GitHub**: https://github.com/sereneinserenade/lexical-comments (77 stars)
- **License**: MIT
- **Status**: Last commit 2022
- **Language**: TypeScript (88.8%)

**Features**:
- Google Docs-like commenting
- Custom CommentNode
- React + Recoil
- Live demo

**Pros**: Modern architecture, TypeScript
**Cons**: Lexical-specific (Facebook's editor framework)

**Recommendation**: ⚠️ Good UX reference, not portable

---

#### 5. comment-on-highlight
- **GitHub**: https://github.com/p10ns11y/comment-on-highlight (14 stars)
- **License**: Not specified
- **Status**: ✅ Active
- **Language**: JavaScript (92.3%)

**Features**:
- Medium-like highlight comments
- Text anchoring
- No dependencies
- Pure React/DOM

**Pros**: Simple, pure implementation
**Cons**: React-only, small community

**Recommendation**: ✅ Good reference for text-anchored UI patterns

---

#### 6. Etherpad Comments Plugin
- **GitHub**: https://github.com/ether/ep_comments_page (46 stars)
- **License**: Apache 2.0
- **Status**: ✅ Active (924 commits)
- **Language**: JavaScript (94.8%)

**Features**:
- Inline comments
- Icon/sidebar modes
- Optional highlighting
- API for programmatic comments
- HTML export

**Pros**: Battle-tested, full-featured
**Cons**: Tightly coupled to Etherpad

**Recommendation**: ⚠️ Reference only, hard to extract

---

#### 7. VS Code Comment API
- **Example**: https://github.com/microsoft/vscode-extension-samples/tree/main/comment-sample
- **License**: MIT
- **Documentation**: Official VS Code API

**Features**:
- Comment threads
- Markdown support (MarkdownString)
- Replies
- Resolution tracking
- Range-based

**For Webview**:
- Can mimic in webviews
- Excellent architectural reference

**Recommendation**: ✅ **Best architectural reference for thread design**

---

### Feature Support Matrix

| Solution | Threads | Mentions | Resolution | Real-Time | Markdown | TypeScript | Text-Anchored |
|----------|---------|----------|------------|-----------|----------|------------|---------------|
| **Yjs + CM6** | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **CM6 Decorations** | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ✅ |
| **Recogito** | ⚠️ | ❌ | ⚠️ | ❌ | ✅ | ⚠️ | ✅ |
| **TipTap Comments** | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ |
| **react-comments** | ✅ | ❌ | ❌ | ❌ | ⚠️ | ✅ | ❌ |
| **Lexical Comments** | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| **comment-on-highlight** | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| **Apache Annotator** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **VS Code API** | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ |

✅ = Built-in | ⚠️ = Can implement | ❌ = Not supported

---

### Implementation Strategies

#### Strategy A: Lightweight (No Real-Time)
**Stack**:
- CodeMirror 6 (base editor)
- @codemirror/lang-markdown
- Custom decoration widgets for comment indicators
- W3C annotation model for data
- Local/API storage

**Pros**: Lightweight, full control, no server needed
**Cons**: No real-time sync
**Timeline**: 2-3 weeks

---

#### Strategy B: Real-Time Collaborative
**Stack**:
- CodeMirror 6
- Yjs + y-codemirror.next
- Y.Map/Y.Array for comments
- Custom CM6 widgets for UI
- WebSocket/WebRTC backend

**Pros**: Real-time, scalable, industry-standard
**Cons**: Backend infrastructure required
**Timeline**: 4-6 weeks

---

#### Strategy C: Hybrid (Recommended) ⭐
**Stack**:
- CodeMirror 6
- Custom decoration-based system
- W3C Web Annotation data model
- Optional Yjs adapter for future real-time

**Pros**: Start simple, scale later
**Cons**: Requires good architecture
**Timeline**: 3-4 weeks initial, +2 weeks for real-time

---

### W3C Web Annotation Data Model

**Standard**: https://www.w3.org/TR/annotation-model/
**JS Implementation**: https://github.com/goodmansasha/annotation-model

**Example Annotation**:
```json
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno1",
  "type": "Annotation",
  "body": {
    "type": "TextualBody",
    "value": "Great point!",
    "format": "text/plain"
  },
  "target": {
    "source": "file:///specs/architecture.md",
    "selector": {
      "type": "TextQuoteSelector",
      "exact": "microservices architecture",
      "prefix": "We will use ",
      "suffix": " for scalability"
    }
  },
  "created": "2025-11-19T10:30:00Z",
  "creator": {
    "id": "mailto:user@example.com",
    "name": "John Doe"
  }
}
```

**Benefits**:
- Interoperable standard
- Position-independent anchoring
- Supports threads via `partOf`
- Extensible

---

### CodeMirror 6 Comment Implementation Example

```typescript
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { StateField } from '@codemirror/state';

// Comment data structure
interface Comment {
  id: string;
  from: number;
  to: number;
  text: string;
  author: string;
  timestamp: Date;
  resolved: boolean;
}

// State field for comments
const commentsField = StateField.define<Comment[]>({
  create: () => [],
  update: (comments, tr) => {
    // Handle comment updates from transactions
    return comments;
  }
});

// View plugin for comment decorations
const commentPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const comments = view.state.field(commentsField);
    const widgets: any[] = [];

    for (const comment of comments) {
      // Add marker decoration
      widgets.push(
        Decoration.mark({
          class: 'cm-comment-highlight'
        }).range(comment.from, comment.to)
      );

      // Add widget for comment icon
      widgets.push(
        Decoration.widget({
          widget: new CommentWidget(comment),
          side: 1
        }).range(comment.to)
      );
    }

    return Decoration.set(widgets, true);
  }
}, {
  decorations: v => v.decorations
});

// Custom widget for comment indicator
class CommentWidget extends WidgetType {
  constructor(readonly comment: Comment) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-comment-indicator';
    span.textContent = '💬';
    span.title = this.comment.text;
    return span;
  }
}
```

---

### Collaborative Commenting with Yjs

```typescript
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';

// Create Yjs document
const ydoc = new Y.Doc();
const ytext = ydoc.getText('codemirror');
const ycomments = ydoc.getArray('comments');

// CodeMirror 6 extensions
const extensions = [
  // Collaborative text editing
  yCollab(ytext),

  // Custom comment sync
  commentSyncPlugin(ycomments)
];

// Add comment
function addComment(from: number, to: number, text: string) {
  ycomments.push([{
    id: generateId(),
    from,
    to,
    text,
    author: currentUser,
    timestamp: new Date().toISOString(),
    resolved: false
  }]);
}

// Listen for comment changes
ycomments.observe(event => {
  event.changes.added.forEach(item => {
    // Update UI for new comments
  });
});
```

---

### Recommendations Summary

#### For Phase 1 MVP:
**Use CodeMirror 6 Decorations + W3C Annotation Model**
- Lightweight, no backend needed
- Full control over UX
- Standards-based data format
- Can add Yjs later

#### For Production with Real-Time:
**Use Yjs + y-codemirror.next**
- Industry standard
- Proven scalability
- Excellent performance
- Active maintenance

#### For Quick Proof-of-Concept:
**Reference TipTap/Lexical implementations**
- Study their comment logic
- Adapt to CodeMirror 6
- Good UX patterns

---

### Additional Resources

**Standards & Specs**:
- W3C Web Annotation Data Model: https://www.w3.org/TR/annotation-model/
- JavaScript implementation: https://github.com/goodmansasha/annotation-model

**CodeMirror 6**:
- Decorations Guide: https://codemirror.net/examples/decoration/
- System Guide: https://codemirror.net/docs/guide/

**Collaboration**:
- Yjs Documentation: https://docs.yjs.dev/
- y-codemirror.next: https://github.com/yjs/y-codemirror.next
- ProseMirror commenting discussion: https://discuss.prosemirror.net/t/using-decorations-for-comments-yes-or-no/6197

---

## Decision: Technology Stack for Extension

Based on all research conducted:

### Editor: CodeMirror 6 ✅
- Supports Live Preview mode (cursor-based syntax revealing)
- Three editing modes: Live Preview, Source, Reading
- Same stack as Obsidian
- Excellent performance and extensibility

### Commenting: Start with Decorations, Scale to Yjs
- **Phase 1**: CM6 decorations + W3C annotation model
- **Phase 4**: Optional Yjs integration for real-time collaboration

### Architecture:
```
┌─────────────────────────────────────┐
│  VS Code Extension                  │
├─────────────────────────────────────┤
│  Custom Sidebar (Tree View)         │
│  ├─ SPECS                           │
│  ├─ AGENTS                          │
│  ├─ COMMANDS                        │
│  └─ BOLTS                           │
├─────────────────────────────────────┤
│  CodeMirror 6 Editor (Webview)      │
│  ├─ Live Preview Mode               │
│  ├─ Source Mode                     │
│  ├─ Reading Mode (HTML render)      │
│  └─ Comment System (Decorations)    │
└─────────────────────────────────────┘
```

---

## Next Steps

1. ✅ **Decided on editing behavior**: Live Preview (CodeMirror 6)
2. ✅ **Chose technology stack**: CodeMirror 6 for editor
3. **Updated PRD** to reflect CodeMirror 6 architecture
4. **Next**: Prototype basic integration with VS Code Custom Editor API
5. **Then**: Implement Live Preview decorations
6. **Then**: Build sidebar tree view for file navigation
7. **Then**: Add Reading and Source modes
8. **Phase 4**: Implement commenting system (decorations-based)
