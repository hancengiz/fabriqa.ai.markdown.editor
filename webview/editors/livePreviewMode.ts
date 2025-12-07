import { ViewPlugin, DecorationSet, Decoration, EditorView, ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { get as getEmoji } from 'node-emoji';
import { DecoratorRegistry } from '../registries/DecoratorRegistry';
import { CheckboxWidget } from '../widgets/CheckboxWidget';
import { EmojiWidget } from '../widgets/EmojiWidget';
import { DecorationContext } from '../interfaces/interfaces';

/**
 * Live Preview Mode Plugin (Obsidian-style)
 *
 * Hides markdown syntax except in the specific markdown element where the cursor is positioned.
 * Works at the inline-element level, not line-by-line.
 */
export const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    private registry: DecoratorRegistry;

    constructor(view: EditorView) {
      this.registry = new DecoratorRegistry();
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      const cursorPos = view.state.selection.main.head;

      // Track which ranges we've already decorated to avoid duplicates
      const decoratedRanges = new Set<string>();

      // Find the active markdown structure containing the cursor
      // Only if the view has focus (otherwise show full preview)
      const activeStructure = view.hasFocus ? this.findActiveStructure(view, cursorPos) : null;

      // Helper to add decorations
      const addDecoration = (decoration: Decoration, from: number, to: number) => {
        const key = `${from}-${to}`;
        if (!decoratedRanges.has(key)) {
          decorations.push(decoration.range(from, to));
          decoratedRanges.add(key);
        }
      };

      // Iterate through entire syntax tree
      syntaxTree(view.state).iterate({
        enter: (node) => {
          // Check if node is part of the active structure
          const isActive = activeStructure ? this.isWithinActiveStructure(node.node, activeStructure) : false;

          // Create context for decorators
          const context: DecorationContext = {
            node: node.node,
            view,
            decorations,
            decoratedRanges,
            isActive,
            addDecoration
          };

          // Delegate to registry
          this.registry.decorate(context);
        }
      });

      // Add custom checkbox detection for patterns not recognized by syntax tree
      // (e.g., checkboxes without list markers: "[ ] todo")
      this.addCustomCheckboxDecorations(view, decorations, activeStructure, cursorPos);

      // Add emoji shortcode decorations
      this.addEmojiDecorations(view, decorations, decoratedRanges, cursorPos);

      return Decoration.set(decorations, true);
    }

    /**
     * Check if a node is within the active structure
     * Uses strict containment to avoid edge case issues
     */
    isWithinActiveStructure(node: SyntaxNode, activeStructure: SyntaxNode): boolean {
      // Node is within active structure if it's completely contained
      return node.from >= activeStructure.from && node.to <= activeStructure.to;
    }

    /**
     * Add custom checkbox decorations for patterns not in the syntax tree
     * This handles checkboxes without list markers like: "[ ] todo"
     */
    addCustomCheckboxDecorations(
      view: EditorView,
      decorations: Range<Decoration>[],
      activeStructure: SyntaxNode | null,
      cursorPos: number
    ): void {
      const doc = view.state.doc;

      for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
        const line = doc.line(lineNum);
        const lineText = line.text;

        // Match checkbox patterns: [ ], [x], [] at start of line (with optional list marker)
        const checkboxMatch = lineText.match(/^(\s*)((?:[-*+]\s)?)(\[(?:\s|x|X|)\])(?:\s|$)/);

        if (checkboxMatch) {
          const indent = checkboxMatch[1];
          const listMarker = checkboxMatch[2];
          const checkboxText = checkboxMatch[3];
          const checkboxStart = line.from + indent.length + listMarker.length;
          const checkboxEnd = checkboxStart + checkboxText.length;

          // Obsidian-style behavior:
          // - If cursor is on this line: show raw markdown (user can edit or use Cmd+Alt+T)
          // - If cursor is NOT on this line: show checkbox widget (clickable)
          // Use view.hasFocus check to ensure we show preview when not focused
          const isLineActive = view.hasFocus && (cursorPos >= line.from && cursorPos <= line.to);

          if (isLineActive) {
            // Cursor is on this line - skip widget, show raw markdown
            continue;
          }

          // Render checkbox widget for inactive lines
          const isChecked = checkboxText.toLowerCase().includes('x');

          // Safety check: ensure checkbox text doesn't contain newlines
          if (!checkboxText.includes('\n')) {
            decorations.push(
              Decoration.replace({
                widget: new CheckboxWidget(isChecked, view, checkboxStart)
              }).range(checkboxStart, checkboxEnd)
            );
          }
        }
      }
    }

    /**
     * Add emoji shortcode decorations
     * Replaces :emoji_name: with actual emoji characters
     * Obsidian-style: Shows raw markdown when cursor is inside the emoji
     */
    addEmojiDecorations(
      view: EditorView,
      decorations: Range<Decoration>[],
      decoratedRanges: Set<string>,
      cursorPos: number
    ): void {
      const doc = view.state.doc;
      const text = doc.toString();

      // Regular expression to match emoji shortcodes like :smile:, :heart:, etc.
      // Match :word: pattern where word contains only letters, numbers, underscores, hyphens, and plus signs
      const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;
      let match;

      while ((match = emojiRegex.exec(text)) !== null) {
        const shortcode = match[1]; // e.g., "smile" from ":smile:"
        const emoji = getEmoji(shortcode);

        // Only create decoration if we found a valid emoji
        if (emoji) {
          const from = match.index;
          const to = match.index + match[0].length;

          // Obsidian-style behavior: if cursor is inside the emoji shortcode,
          // show the raw markdown instead of the emoji widget
          // Use view.hasFocus check
          const isEmojiActive = view.hasFocus && (cursorPos > from && cursorPos < to);

          if (isEmojiActive) {
            // Cursor is inside - skip the widget, show raw markdown
            continue;
          }

          const rangeKey = `emoji-${from}-${to}`;

          if (!decoratedRanges.has(rangeKey)) {
            decorations.push(
              Decoration.replace({
                widget: new EmojiWidget(emoji)
              }).range(from, to)
            );
            decoratedRanges.add(rangeKey);
          }
        }
      }
    }

    /**
     * Find the smallest markdown structure that contains the cursor.
     * This determines which specific element should remain in "source mode".
     */
    findActiveStructure(view: EditorView, cursorPos: number): SyntaxNode | null {
      let activeStructure: SyntaxNode | null = null;

      syntaxTree(view.state).iterate({
        enter: (node) => {
          // Check if cursor is within this node's range
          // For inline structures, cursor must be strictly inside (not at exact boundary)
          // This prevents issues when cursor is between two inline elements
          const isInlineStructure = ['Emphasis', 'StrongEmphasis', 'Link', 'Image', 'InlineCode', 'Strikethrough'].includes(node.type.name);

          let cursorInNode: boolean;
          if (isInlineStructure) {
            // For inline: cursor must be strictly inside, not at the boundary
            cursorInNode = cursorPos > node.from && cursorPos < node.to;
          } else {
            // For block-level: cursor can be at boundary
            cursorInNode = cursorPos >= node.from && cursorPos <= node.to;
          }

          if (!cursorInNode) {
            return false; // Don't explore this branch
          }

          // Define structures that should become "active" (show raw markdown)
          const structureTypes = [
            // Block-level structures
            'Frontmatter',
            'FencedCode',
            'CodeBlock',
            'ATXHeading1', 'ATXHeading2', 'ATXHeading3',
            'ATXHeading4', 'ATXHeading5', 'ATXHeading6',
            'Blockquote',
            'ListItem',
            'HorizontalRule',

            // Inline structures
            'Emphasis',
            'StrongEmphasis',
            'Link',
            'Image',
            'InlineCode',
            'Strikethrough'
          ];

          if (structureTypes.includes(node.type.name)) {
            // Keep the smallest (most specific) structure
            if (!activeStructure || (node.to - node.from) < (activeStructure.to - activeStructure.from)) {
              activeStructure = node.node;
            }
          }

          return true; // Continue exploring children to find more specific structure
        }
      });

      return activeStructure;
    }
  },
  {
    decorations: (v) => v.decorations
  }
);
