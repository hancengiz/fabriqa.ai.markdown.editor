# Markdown Live Preview Library

A reusable CodeMirror 6 plugin that provides Obsidian-style markdown editing by hiding syntax markers except in the active element where the cursor is positioned.

## Features

- 🎯 **Cursor-aware hiding**: Shows markdown syntax only in the element being edited
- 🔧 **Highly configurable**: Customize which nodes to hide and which to treat as elements
- 🎨 **Safe CSS hiding**: Uses font-size/letter-spacing approach that doesn't break cursor placement
- 📦 **Modular design**: Clean separation of concerns with utility functions
- 🚀 **Performance optimized**: Efficient syntax tree traversal and decoration management
- 🎓 **Well-documented**: Comprehensive TypeScript types and JSDoc comments

## Inspiration

This library is inspired by:
- [codemirror-rich-markdoc](https://github.com/segphault/codemirror-rich-markdoc) - Rich markdown editing for CodeMirror 6
- [obsidian-codemirror-options](https://github.com/nothingislost/obsidian-codemirror-options) - Safe CSS hiding approach
- Obsidian's Live Preview mode - User experience patterns

## Installation

This library is designed to be used internally within your CodeMirror-based markdown editor.

```typescript
import { createMarkdownLivePreview, markdownHidingStyles } from './lib/markdown-live-preview';
```

## Basic Usage

```typescript
import { EditorView } from '@codemirror/view';
import { createMarkdownLivePreview, markdownHidingStyles } from './lib/markdown-live-preview';

const view = new EditorView({
  extensions: [
    createMarkdownLivePreview(), // Use default config
    markdownHidingStyles,         // Apply CSS styles
  ],
});
```

## Custom Configuration

```typescript
import { createMarkdownLivePreview } from './lib/markdown-live-preview';

const livePreview = createMarkdownLivePreview({
  // Customize which nodes are treated as elements (show markers when cursor inside)
  elementNodes: [
    'StrongEmphasis',
    'Emphasis',
    'InlineCode',
    'Link',
  ],

  // Customize which nodes to hide (the markers themselves)
  hiddenNodes: [
    'EmphasisMark',
    'StrongEmphasisMark',
    'CodeMark',
    'LinkMark',
  ],

  // Custom CSS class for hidden markers
  hiddenClass: 'my-hidden-markers',

  // Whether to use strict cursor containment for inline elements
  strictInlineCursor: true,
});
```

## Advanced Usage

### Custom CSS Hiding

```typescript
import { EditorView } from '@codemirror/view';
import { createMarkdownLivePreview } from './lib/markdown-live-preview';

const customTheme = EditorView.theme({
  '.my-hidden-markers': {
    fontSize: '1px !important',
    letterSpacing: '-1ch',
    color: 'transparent',
    fontFamily: 'monospace',
  },
});

const view = new EditorView({
  extensions: [
    createMarkdownLivePreview({ hiddenClass: 'my-hidden-markers' }),
    customTheme,
  ],
});
```

### Using Utility Functions

```typescript
import { findActiveStructure, isCursorInNode } from './lib/markdown-live-preview';
import { syntaxTree } from '@codemirror/language';

// Find which markdown element contains the cursor
const tree = syntaxTree(view.state);
const cursorPos = view.state.selection.main.head;
const activeStructure = findActiveStructure(tree, cursorPos, ['StrongEmphasis', 'Emphasis']);

// Check if cursor is within a specific node
const isInside = isCursorInNode(cursorPos, someNode);
```

## How It Works

1. **Syntax Tree Traversal**: The plugin iterates through CodeMirror's syntax tree
2. **Active Structure Detection**: Finds the smallest markdown element containing the cursor
3. **Selective Decoration**: Applies hiding decorations to markers outside the active structure
4. **Safe CSS Hiding**: Uses `font-size: 1px` + `letter-spacing: -1ch` instead of `display: none`

## API Reference

### `createMarkdownLivePreview(config?)`

Creates a CodeMirror ViewPlugin for live preview mode.

**Parameters:**
- `config` (optional): Configuration object

**Returns:** CodeMirror ViewPlugin

### `markdownHidingStyles`

Theme extension with safe CSS hiding styles.

### Configuration Options

```typescript
interface MarkdownLivePreviewConfig {
  elementNodes?: string[];      // Node types to treat as elements
  hiddenNodes?: string[];        // Node types to hide
  hiddenClass?: string;          // CSS class for hiding
  strictInlineCursor?: boolean;  // Strict cursor containment
}
```

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  elementNodes: [
    'FencedCode', 'CodeBlock',
    'ATXHeading1', 'ATXHeading2', 'ATXHeading3',
    'ATXHeading4', 'ATXHeading5', 'ATXHeading6',
    'Blockquote', 'ListItem',
    'Emphasis', 'StrongEmphasis',
    'Link', 'InlineCode', 'Strikethrough',
  ],
  hiddenNodes: [
    'HardBreak', 'LinkMark', 'EmphasisMark',
    'StrongEmphasisMark', 'CodeMark', 'CodeInfo',
    'URL', 'HeaderMark',
  ],
  hiddenClass: 'cm-md-hidden',
  strictInlineCursor: true,
};
```

## Architecture

```
lib/markdown-live-preview/
├── index.ts              # Main export file
├── plugin.ts             # ViewPlugin implementation
├── types.ts              # TypeScript types and config
├── cursor-detection.ts   # Cursor position utilities
├── decorations.ts        # Decoration management
├── styles.ts             # CSS theme extensions
└── README.md             # This file
```

## Performance Considerations

- Decorations are only rebuilt when document changes, viewport changes, or selection changes
- Syntax tree traversal is limited to visible ranges
- Efficient node containment checks using position comparisons

## Limitations

- Requires CodeMirror 6 with `@codemirror/language` and `@codemirror/view`
- Depends on proper syntax tree structure from markdown parser
- CSS hiding approach may have minor rendering artifacts in some edge cases

## Contributing

This library is part of the Fabriqa AI Markdown Editor project. To contribute:

1. Make changes to files in `webview/lib/markdown-live-preview/`
2. Test thoroughly in Live Preview mode
3. Update this README if adding new features
4. Ensure TypeScript types are accurate

## License

MIT License - See project root for details

## Credits

- Inspired by [codemirror-rich-markdoc](https://github.com/segphault/codemirror-rich-markdoc)
- CSS hiding approach from [obsidian-codemirror-options](https://github.com/nothingislost/obsidian-codemirror-options)
- Built with ❤️ by the Fabriqa AI team
