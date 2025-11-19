import { ViewPlugin, DecorationSet, Decoration, EditorView, ViewUpdate, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';

/**
 * Widget for clickable links in Live Preview
 */
class LinkWidget extends WidgetType {
  constructor(readonly url: string, readonly text: string) {
    super();
  }

  toDOM() {
    const link = document.createElement('a');
    link.textContent = this.text;
    link.href = this.url;
    link.className = 'cm-link-preview';
    link.title = this.url;
    link.style.cssText = `
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      cursor: pointer;
    `;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // You could send a message to VS Code to open the link
      console.log('Link clicked:', this.url);
    });
    return link;
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Live Preview Mode Plugin
 * Hides markdown syntax except in the markdown structure where the cursor is positioned
 * Works at the structural level (like Obsidian) - not line-by-line
 */
export const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
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

      // Find the active markdown structure containing the cursor
      const activeStructure = this.findActiveStructure(view, cursorPos);

      // Iterate through entire syntax tree
      syntaxTree(view.state).iterate({
        enter: (node) => {
          // Skip decorating nodes that are part of the active structure
          if (activeStructure && node.from >= activeStructure.from && node.to <= activeStructure.to) {
            return; // Skip this node but continue iteration
          }

          this.processNode(node, view, decorations);
        }
      });

      return Decoration.set(decorations, true);
    }

    /**
     * Find the smallest markdown structure that contains the cursor
     * This determines which block should remain in "source mode"
     */
    findActiveStructure(view: EditorView, cursorPos: number): SyntaxNode | null {
      let activeStructure: SyntaxNode | null = null;

      syntaxTree(view.state).iterate({
        enter: (node) => {
          // Check if cursor is within this node's range
          const cursorInNode = cursorPos >= node.from && cursorPos <= node.to;

          if (!cursorInNode) {
            return false; // Don't explore this branch
          }

          // Define structures that should become "active" (show raw markdown)
          const structureTypes = [
            // Block-level structures
            'FencedCode',
            'CodeBlock',
            'ATXHeading1', 'ATXHeading2', 'ATXHeading3',
            'ATXHeading4', 'ATXHeading5', 'ATXHeading6',
            'Blockquote',
            'ListItem',

            // Inline structures
            'Emphasis',
            'StrongEmphasis',
            'Link',
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

    processNode(node: SyntaxNode, view: EditorView, decorations: Range<Decoration>[]): void {
      const { from, to, type } = node;
      const nodeText = view.state.doc.sliceString(from, to);

      switch (type.name) {
        case 'HeaderMark':
          // Hide header marks (# ## ### etc.)
          if (nodeText.match(/^#+\s?$/)) {
            decorations.push(
              Decoration.replace({ inclusive: false }).range(from, to)
            );
          }
          break;

        case 'ATXHeading1':
        case 'ATXHeading2':
        case 'ATXHeading3':
        case 'ATXHeading4':
        case 'ATXHeading5':
        case 'ATXHeading6':
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

        case 'EmphasisMark':
          // Hide emphasis marks (*, **, _, __) - matches any combination
          if (nodeText.match(/^[*_]+$/)) {
            decorations.push(
              Decoration.replace({ inclusive: false }).range(from, to)
            );
          }
          break;

        case 'StrongEmphasisMark':
          // Hide strong emphasis marks (** or __) - fallback if EmphasisMark doesn't catch it
          if (nodeText.match(/^[*_]{2,}$/)) {
            decorations.push(
              Decoration.replace({ inclusive: false }).range(from, to)
            );
          }
          break;

        case 'Link':
          // Handle link syntax [text](url)
          this.handleLink(node, view, decorations);
          break;

        case 'CodeMark':
          // Hide inline code marks (`)
          decorations.push(
            Decoration.replace({ inclusive: false }).range(from, to)
          );
          break;

        case 'InlineCode':
          // Style inline code
          decorations.push(
            Decoration.mark({
              class: 'cm-inline-code-preview',
              attributes: {
                style: `
                  background-color: var(--vscode-textCodeBlock-background);
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-family: var(--vscode-editor-font-family);
                `
              }
            }).range(from, to)
          );
          break;

        case 'CodeInfo':
          // Slightly dim code block language info
          decorations.push(
            Decoration.mark({
              class: 'cm-code-info',
              attributes: {
                style: 'opacity: 0.5; font-size: 0.9em;'
              }
            }).range(from, to)
          );
          break;

        case 'QuoteMark':
          // Style blockquote marks
          decorations.push(
            Decoration.mark({
              class: 'cm-quote-mark',
              attributes: {
                style: `
                  color: var(--vscode-descriptionForeground);
                  opacity: 0.6;
                `
              }
            }).range(from, to)
          );
          break;

        case 'ListMark':
          // Style list marks
          decorations.push(
            Decoration.mark({
              class: 'cm-list-mark',
              attributes: {
                style: `
                  color: var(--vscode-symbolIcon-arrayForeground);
                  font-weight: bold;
                `
              }
            }).range(from, to)
          );
          break;

        case 'Strikethrough':
          // Apply strikethrough styling
          decorations.push(
            Decoration.mark({
              class: 'cm-strikethrough',
              attributes: {
                style: 'text-decoration: line-through;'
              }
            }).range(from, to)
          );
          break;

        case 'TaskMarker':
          // Style task list checkboxes
          decorations.push(
            Decoration.mark({
              class: 'cm-task-marker'
            }).range(from, to)
          );
          break;

        default:
          break;
      }
    }

    handleLink(linkNode: SyntaxNode, view: EditorView, decorations: Range<Decoration>[]): void {
      let linkText = '';
      let linkUrl = '';
      let markStart = -1;
      let markEnd = -1;

      // Parse link structure [text](url)
      linkNode.node.cursor().iterate((node) => {
        const nodeText = view.state.doc.sliceString(node.from, node.to);

        switch (node.type.name) {
          case 'LinkMark':
            if (nodeText === '[') {
              markStart = node.from;
            } else if (nodeText === ']') {
              markEnd = node.to;
            }
            // Hide link marks
            decorations.push(
              Decoration.replace({ inclusive: false }).range(node.from, node.to)
            );
            break;

          case 'LinkLabel':
            linkText = nodeText;
            break;

          case 'URL':
            linkUrl = nodeText;
            // Hide URL and parentheses
            // Find the opening and closing parentheses
            const urlFullRange = nodeText;
            const openParenPos = view.state.doc.sliceString(0, node.from).lastIndexOf('(');
            const closeParenPos = view.state.doc.sliceString(node.to).indexOf(')');

            if (openParenPos !== -1) {
              // Hide opening paren
              decorations.push(
                Decoration.replace({ inclusive: false }).range(node.from - 1, node.from)
              );
            }

            // Hide URL itself
            decorations.push(
              Decoration.replace({ inclusive: false }).range(node.from, node.to)
            );

            if (closeParenPos !== -1) {
              // Hide closing paren
              decorations.push(
                Decoration.replace({ inclusive: false }).range(node.to, node.to + 1)
              );
            }
            break;
        }
      });

      // Apply link styling to the text
      if (linkText && linkUrl && markStart !== -1 && markEnd !== -1) {
        decorations.push(
          Decoration.mark({
            class: 'cm-link-text',
            attributes: {
              style: `
                color: var(--vscode-textLink-foreground);
                text-decoration: underline;
                cursor: pointer;
              `,
              title: linkUrl
            }
          }).range(markStart + 1, markEnd - 1)
        );
      }
    }
  },
  {
    decorations: (v) => v.decorations
  }
);
