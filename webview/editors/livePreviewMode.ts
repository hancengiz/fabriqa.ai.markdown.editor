import { ViewPlugin, DecorationSet, Decoration, EditorView, ViewUpdate, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';

/**
 * Widget for clickable links in Live Preview
 * Supports Cmd/Ctrl+Click to open markdown files
 */
class LinkWidget extends WidgetType {
  constructor(readonly url: string, readonly text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.textContent = this.text;
    span.className = 'cm-link-preview';
    span.title = this.url;
    span.style.cssText = `
      color: var(--vscode-textLink-foreground);
      text-decoration: underline;
      cursor: pointer;
    `;

    span.addEventListener('click', (e) => {
      // Only open link on Cmd/Ctrl+Click
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();

        // Send message to VS Code to open the file
        const vscode = (window as any).acquireVsCodeApi?.() || (window as any).vscode;
        if (vscode) {
          vscode.postMessage({
            type: 'openLink',
            url: this.url
          });
        }
      }
    });

    return span;
  }

  ignoreEvent(event: Event) {
    // Allow click events with modifier keys
    if (event.type === 'click') {
      const mouseEvent = event as MouseEvent;
      if (mouseEvent.metaKey || mouseEvent.ctrlKey) {
        return true; // Editor should ignore this, widget handles it
      }
    }
    return false;
  }
}

/**
 * Widget for clickable checkboxes in Live Preview
 * Renders an actual HTML checkbox that can be clicked to toggle state
 */
class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly view: EditorView,
    readonly pos: number
  ) {
    super();
  }

  toDOM() {
    // Create a wrapper span to ensure proper event handling
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-task-checkbox-wrapper';
    wrapper.style.cssText = `
      display: inline-block;
      vertical-align: middle;
      margin-right: 4px;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.checked;
    checkbox.className = 'cm-task-checkbox';
    checkbox.style.cssText = `
      cursor: pointer;
      pointer-events: auto;
      width: 16px;
      height: 16px;
      vertical-align: middle;
    `;

    // Handle checkbox click to toggle state in document
    checkbox.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    checkbox.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleCheckbox();
    });

    wrapper.appendChild(checkbox);
    return wrapper;
  }

  toggleCheckbox() {
    const line = this.view.state.doc.lineAt(this.pos);
    const lineText = line.text;

    // Find the checkbox pattern in the line (with or without list marker)
    // Support [ ], [], and [x] patterns
    const uncheckedMatch = lineText.match(/^(\s*)(?:[-*+]\s)?(\[(?:\s|)\])/);
    const checkedMatch = lineText.match(/^(\s*)(?:[-*+]\s)?(\[x\])/i);

    if (checkedMatch) {
      // Change [x] to [ ]
      const newLine = lineText.replace(/\[x\]/i, '[ ]');
      this.view.dispatch({
        changes: {
          from: line.from,
          to: line.to,
          insert: newLine
        }
      });
    } else if (uncheckedMatch) {
      // Change [ ] or [] to [x]
      const newLine = lineText.replace(/\[(?:\s|)\]/, '[x]');
      this.view.dispatch({
        changes: {
          from: line.from,
          to: line.to,
          insert: newLine
        }
      });
    }
  }

  ignoreEvent(event: Event) {
    // Return TRUE to tell the editor to IGNORE the event (don't move cursor)
    // The widget will handle the click itself
    return event.type === 'mousedown' || event.type === 'click';
  }
}

/**
 * Live Preview Mode Plugin (Obsidian-style)
 *
 * Hides markdown syntax except in the specific markdown element where the cursor is positioned.
 * Works at the inline-element level, not line-by-line.
 *
 * Example: In "word **bold1** text **bold2** end"
 * - Clicking inside **bold1** shows: word **bold1** text bold2 end
 * - Clicking inside **bold2** shows: word bold1 text **bold2** end
 * - Clicking outside both shows: word bold1 text bold2 end
 *
 * This provides granular control where only the element being edited shows raw markdown.
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
      // This could be a specific inline element like one bold section: **text**
      const activeStructure = this.findActiveStructure(view, cursorPos);

      // Iterate through entire syntax tree
      syntaxTree(view.state).iterate({
        enter: (node) => {
          // Skip decorating nodes that are part of the active structure
          // This includes the structure itself and all its children (e.g., the ** marks)
          if (activeStructure && node.from >= activeStructure.from && node.to <= activeStructure.to) {
            // Return false to skip this node and its children entirely
            // This means syntax will remain visible for the active element
            return false;
          }

          // For all other nodes, apply decorations (hide syntax)
          this.processNode(node, view, decorations);
        }
      });

      // Add custom checkbox detection for patterns not recognized by syntax tree
      // (e.g., checkboxes without list markers: "[ ] todo")
      this.addCustomCheckboxDecorations(view, decorations, activeStructure, cursorPos);

      return Decoration.set(decorations, true);
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
          if (cursorPos >= line.from && cursorPos <= line.to) {
            // Cursor is on this line - skip widget, show raw markdown
            continue;
          }

          // Render checkbox widget for inactive lines
          const isChecked = checkboxText.toLowerCase().includes('x');

          decorations.push(
            Decoration.replace({
              widget: new CheckboxWidget(isChecked, view, checkboxStart)
            }).range(checkboxStart, checkboxEnd)
          );
        }
      }
    }

    /**
     * Find the smallest markdown structure that contains the cursor.
     * This determines which specific element should remain in "source mode".
     *
     * For example, if the cursor is inside one **bold** section on a line with multiple
     * bold sections, this returns only that specific StrongEmphasis node, not the entire line.
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
          // Replace task list checkboxes with clickable widgets
          const isChecked = nodeText.toLowerCase().includes('x');
          decorations.push(
            Decoration.replace({
              widget: new CheckboxWidget(isChecked, view, from)
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
      let linkStart = linkNode.from;
      let linkEnd = linkNode.to;

      // Parse link structure [text](url)
      linkNode.node.cursor().iterate((node) => {
        const nodeText = view.state.doc.sliceString(node.from, node.to);

        switch (node.type.name) {
          case 'LinkLabel':
            linkText = nodeText;
            break;

          case 'URL':
            linkUrl = nodeText;
            break;
        }
      });

      // Replace entire link with widget [text](url) -> clickable text
      if (linkText && linkUrl) {
        decorations.push(
          Decoration.replace({
            widget: new LinkWidget(linkUrl, linkText)
          }).range(linkStart, linkEnd)
        );
      }
    }
  },
  {
    decorations: (v) => v.decorations
  }
);
