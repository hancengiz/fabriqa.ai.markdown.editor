import { ViewPlugin, DecorationSet, Decoration, EditorView, ViewUpdate, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { MermaidDiagramWidget } from '../lib/mermaid-widget';
import { getCurrentTheme } from '../themes';

// Decoration for hiding markdown syntax markers
// Uses Decoration.mark() with CSS class instead of Decoration.replace()
// This approach is more reliable and doesn't break cursor placement
const hiddenDecoration = Decoration.mark({ class: 'cm-md-hidden' });

/**
 * Widget for clickable links in Live Preview
 * Supports Cmd/Ctrl+Click to open markdown files
 */
class LinkWidget extends WidgetType {
  constructor(readonly url: string, readonly text: string) {
    super();
  }

  toDOM() {
    const theme = getCurrentTheme();
    const span = document.createElement('span');
    span.textContent = this.text;
    span.className = 'cm-link-preview';
    span.title = this.url;
    span.style.cssText = `
      color: ${theme.link.default};
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
 * Widget for rendering images in Live Preview
 * Displays images inline with alt text fallback
 */
class ImageWidget extends WidgetType {
  constructor(readonly url: string, readonly alt: string) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-image-wrapper';
    wrapper.style.cssText = `
      display: inline-block;
      max-width: 100%;
      margin: 8px 0;
    `;

    const img = document.createElement('img');
    img.src = this.url;
    img.alt = this.alt;
    img.title = this.alt;
    img.style.cssText = `
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      display: block;
    `;

    // Handle image load error
    img.onerror = () => {
      const errorSpan = document.createElement('span');
      errorSpan.textContent = `[Image not found: ${this.alt}]`;
      errorSpan.style.cssText = `
        color: #d1242f;
        font-style: italic;
        padding: 4px 8px;
        background-color: #ffebe9;
        border-radius: 4px;
        display: inline-block;
      `;
      wrapper.innerHTML = '';
      wrapper.appendChild(errorSpan);
    };

    wrapper.appendChild(img);
    return wrapper;
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Widget for horizontal rules in Live Preview
 * Renders a styled horizontal line
 */
class HorizontalRuleWidget extends WidgetType {
  toDOM() {
    const theme = getCurrentTheme();
    const hr = document.createElement('hr');
    hr.className = 'cm-horizontal-rule';
    hr.style.cssText = `
      display: block;
      width: 100%;
      border: none;
      border-bottom: 2px solid ${theme.borderColor.muted};
      margin: 16px 0;
      opacity: 0.6;
    `;
    return hr;
  }

  ignoreEvent() {
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
    const theme = getCurrentTheme();
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-task-checkbox-wrapper';
    wrapper.style.cssText = `
      display: inline-block;
      vertical-align: middle;
      margin-right: 6px;
      position: relative;
      width: 16px;
      height: 16px;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.checked;
    checkbox.className = 'cm-task-checkbox';

    // Obsidian-style checkbox using theme colors
    checkbox.style.cssText = `
      appearance: none;
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border: 1.5px solid ${theme.checkbox.border};
      border-radius: 3px;
      background: ${theme.checkbox.background};
      cursor: pointer;
      pointer-events: auto;
      position: absolute;
      top: 0;
      left: 0;
    `;

    // Add checked state styling
    if (this.checked) {
      checkbox.style.backgroundColor = theme.checkbox.checkedBackground;
      checkbox.style.borderColor = theme.checkbox.checkedBorder;

      // Create checkmark SVG
      const checkmark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      checkmark.setAttribute('width', '12');
      checkmark.setAttribute('height', '12');
      checkmark.setAttribute('viewBox', '0 0 12 12');
      checkmark.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -45%);
        pointer-events: none;
        z-index: 10;
      `;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', theme.checkbox.checkmark);
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('d', 'M2 6l3 3 5-6');

      checkmark.appendChild(path);
      wrapper.appendChild(checkmark);
    }

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

      // Track which ranges we've already decorated to avoid duplicates
      const decoratedRanges = new Set<string>();

      // Find the active markdown structure containing the cursor
      // This could be a specific inline element like one bold section: **text**
      const activeStructure = this.findActiveStructure(view, cursorPos);

      // Iterate through entire syntax tree
      syntaxTree(view.state).iterate({
        enter: (node) => {
          // Skip decorating nodes that are part of the active structure
          // This includes the structure itself and all its children (e.g., the ** marks)
          if (activeStructure && this.isWithinActiveStructure(node, activeStructure)) {
            // Return false to skip this node and its children entirely
            // This means syntax will remain visible for the active element
            return false;
          }

          // For all other nodes, apply decorations (hide syntax)
          // Note: We don't check decoratedRanges at the node level anymore,
          // only inside processNode() at the decoration level to prevent duplicates
          this.processNode(node, view, decorations, decoratedRanges);
        }
      });

      // Add custom checkbox detection for patterns not recognized by syntax tree
      // (e.g., checkboxes without list markers: "[ ] todo")
      this.addCustomCheckboxDecorations(view, decorations, activeStructure, cursorPos);

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
          // For inline structures, cursor must be strictly inside (not at exact boundary)
          // This prevents issues when cursor is between two inline elements
          const isInlineStructure = ['Emphasis', 'StrongEmphasis', 'Link', 'InlineCode', 'Strikethrough'].includes(node.type.name);

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
            'FencedCode',
            'CodeBlock',
            'ATXHeading1', 'ATXHeading2', 'ATXHeading3',
            'ATXHeading4', 'ATXHeading5', 'ATXHeading6',
            'Blockquote',
            'HorizontalRule',

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

    processNode(node: SyntaxNode, view: EditorView, decorations: Range<Decoration>[], decoratedRanges: Set<string>): void {
      const { from, to, type } = node;
      const nodeText = view.state.doc.sliceString(from, to);
      const theme = getCurrentTheme();

      // Helper function to add decoration only if range not already decorated
      const addDecoration = (decoration: Decoration, from: number, to: number) => {
        const key = `${from}-${to}`;
        if (!decoratedRanges.has(key)) {
          decorations.push(decoration.range(from, to));
          decoratedRanges.add(key);
        }
      };

      switch (type.name) {
        case 'ATXHeading1':
          // Style h1 headings
          addDecoration(
            Decoration.mark({
              class: 'cm-heading-1',
              attributes: {
                style: 'font-size: 2em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
              }
            }),
            from,
            to
          );
          break;

        case 'ATXHeading2':
          // Style h2 headings
          addDecoration(
            Decoration.mark({
              class: 'cm-heading-2',
              attributes: {
                style: 'font-size: 1.5em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
              }
            }),
            from,
            to
          );
          break;

        case 'ATXHeading3':
          // Style h3 headings
          addDecoration(
            Decoration.mark({
              class: 'cm-heading-3',
              attributes: {
                style: 'font-size: 1.25em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
              }
            }),
            from,
            to
          );
          break;

        case 'ATXHeading4':
          // Style h4 headings
          addDecoration(
            Decoration.mark({
              class: 'cm-heading-4',
              attributes: {
                style: 'font-size: 1em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
              }
            }),
            from,
            to
          );
          break;

        case 'ATXHeading5':
          // Style h5 headings
          addDecoration(
            Decoration.mark({
              class: 'cm-heading-5',
              attributes: {
                style: 'font-size: 0.875em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
              }
            }),
            from,
            to
          );
          break;

        case 'ATXHeading6':
          // Style h6 headings
          addDecoration(
            Decoration.mark({
              class: 'cm-heading-6',
              attributes: {
                style: 'font-size: 0.85em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
              }
            }),
            from,
            to
          );
          break;

        case 'HeaderMark':
          // Hide header marks (# ## ### etc.)
          if (nodeText.match(/^#+\s?$/)) {
            addDecoration(hiddenDecoration, from, to);
          }
          break;

        case 'EmphasisMark':
          // Hide emphasis marks (*, **, _, __) - matches any combination
          if (nodeText.match(/^[*_]+$/)) {
            addDecoration(hiddenDecoration, from, to);
          }
          break;

        case 'StrikethroughMark':
          // Hide strikethrough marks (~~)
          if (nodeText.match(/^~~$/)) {
            addDecoration(hiddenDecoration, from, to);
          }
          break;

        case 'Link':
          // Handle link syntax [text](url)
          this.handleLink(node, view, decorations, decoratedRanges);
          break;

        case 'Image':
          // Handle image syntax ![alt](url)
          this.handleImage(node, view, decorations, decoratedRanges);
          break;

        case 'CodeMark':
          // Hide inline code marks (`)
          addDecoration(hiddenDecoration, from, to);
          break;

        case 'InlineCode':
          // Style inline code
          addDecoration(
            Decoration.mark({
              class: 'cm-inline-code-preview',
              attributes: {
                style: `
                  background-color: ${theme.code.inlineBackground};
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                `
              }
            }),
            from,
            to
          );
          break;

        case 'CodeInfo':
          // Slightly dim code block language info
          addDecoration(
            Decoration.mark({
              class: 'cm-code-info',
              attributes: {
                style: 'opacity: 0.5; font-size: 0.9em;'
              }
            }),
            from,
            to
          );
          break;

        case 'QuoteMark':
          // Style blockquote marks
          addDecoration(
            Decoration.mark({
              class: 'cm-quote-mark',
              attributes: {
                style: `
                  color: ${theme.blockquote.text};
                  opacity: 0.6;
                `
              }
            }),
            from,
            to
          );
          break;

        case 'Blockquote':
          // Check if this is a GitHub alert (> [!NOTE], > [!TIP], etc.)
          this.handleBlockquoteOrAlert(node, view, decorations, decoratedRanges, addDecoration);
          break;

        case 'ListMark':
          // Style list marks
          addDecoration(
            Decoration.mark({
              class: 'cm-list-mark',
              attributes: {
                style: `
                  color: ${theme.fgColor.accent};
                  font-weight: bold;
                `
              }
            }),
            from,
            to
          );
          break;

        case 'Strikethrough':
          // Apply strikethrough styling
          addDecoration(
            Decoration.mark({
              class: 'cm-strikethrough',
              attributes: {
                style: 'text-decoration: line-through !important;'
              }
            }),
            from,
            to
          );
          break;

        case 'TaskMarker':
          // Replace task list checkboxes with clickable widgets
          const isChecked = nodeText.toLowerCase().includes('x');
          const rangeKey = `${from}-${to}`;
          if (!decoratedRanges.has(rangeKey)) {
            decorations.push(
              Decoration.replace({
                widget: new CheckboxWidget(isChecked, view, from)
              }).range(from, to)
            );
            decoratedRanges.add(rangeKey);
          }
          break;

        case 'CodeBlock':
          // Add light gray background to code blocks
          addDecoration(
            Decoration.mark({
              class: 'cm-code-block',
              attributes: {
                style: `
                  background-color: ${theme.code.background};
                  padding: 4px 0;
                  display: block;
                `
              }
            }),
            from,
            to
          );

          // Apply line-level background to each line in the code block
          // This ensures empty lines also get the background color
          const doc = view.state.doc;
          const startLine = doc.lineAt(from);
          const endLine = doc.lineAt(to);

          for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
            const line = doc.line(lineNum);
            const lineKey = `code-block-line-${line.from}`;
            if (!decoratedRanges.has(lineKey)) {
              decorations.push(
                Decoration.line({
                  class: 'cm-code-block-line',
                  attributes: {
                    style: `background-color: ${theme.code.background};`
                  }
                }).range(line.from)
              );
              decoratedRanges.add(lineKey);
            }
          }
          break;

        case 'FencedCode':
          // Handle Mermaid diagrams in code blocks
          this.handleMermaidDiagram(node, view, decorations, decoratedRanges);
          break;

        case 'HorizontalRule':
          // Replace horizontal rule markdown with styled hr element
          const hrKey = `${from}-${to}`;
          if (!decoratedRanges.has(hrKey)) {
            decorations.push(
              Decoration.replace({
                widget: new HorizontalRuleWidget()
              }).range(from, to)
            );
            decoratedRanges.add(hrKey);
          }
          break;

        default:
          break;
      }
    }

    /**
     * Handle Mermaid diagram code blocks
     * Shows diagram widget and hides code block content
     * Obsidian-style behavior: shows raw code when cursor is inside the block
     */
    handleMermaidDiagram(fencedCodeNode: SyntaxNode, view: EditorView, decorations: Range<Decoration>[], decoratedRanges: Set<string>): void {
      const theme = getCurrentTheme();
      let isMermaid = false;
      let mermaidCode = '';
      let codeStart = fencedCodeNode.from;
      let codeEnd = fencedCodeNode.to;

      // Parse the FencedCode structure to find CodeInfo and CodeText
      fencedCodeNode.node.cursor().iterate((node) => {
        if (node.type.name === 'CodeInfo') {
          const lang = view.state.doc.sliceString(node.from, node.to).trim();
          isMermaid = lang === 'mermaid';
        } else if (node.type.name === 'CodeText') {
          mermaidCode = view.state.doc.sliceString(node.from, node.to);
        }
      });

      // If this is NOT a mermaid code block, add background styling
      if (!isMermaid) {
        const rangeKey = `code-block-${codeStart}`;
        if (!decoratedRanges.has(rangeKey)) {
          // Apply background to the entire code block range
          decorations.push(
            Decoration.mark({
              class: 'cm-code-block',
              attributes: {
                style: `
                  background-color: ${theme.code.background};
                  padding: 4px 0;
                  display: block;
                `
              }
            }).range(codeStart, codeEnd)
          );
          decoratedRanges.add(rangeKey);

          // Apply line-level background to each line in the code block
          // This ensures empty lines also get the background color
          const doc = view.state.doc;
          const startLine = doc.lineAt(codeStart);
          const endLine = doc.lineAt(codeEnd);

          for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
            const line = doc.line(lineNum);
            const lineKey = `code-block-line-${line.from}`;
            if (!decoratedRanges.has(lineKey)) {
              decorations.push(
                Decoration.line({
                  class: 'cm-code-block-line',
                  attributes: {
                    style: `background-color: ${theme.code.background};`
                  }
                }).range(line.from)
              );
              decoratedRanges.add(lineKey);
            }
          }
        }
        return;
      }

      // If this is a mermaid code block, check cursor position and selection
      if (isMermaid && mermaidCode) {
        const selection = view.state.selection.main;
        const cursorPos = selection.head;
        const selectionStart = selection.from;
        const selectionEnd = selection.to;

        // Obsidian-style behavior: show raw code if:
        // 1. Cursor is inside the code block, OR
        // 2. The code block is part of a text selection (selection overlaps with code block)
        // This is important for:
        // - Search functionality - when a match is found in mermaid code
        // - Copy/paste - user needs to see the raw code when selecting text
        // - Editing - user needs to see raw code when cursor is inside
        const cursorInside = cursorPos >= codeStart && cursorPos <= codeEnd;
        const selectionOverlaps =
          (selectionStart <= codeEnd && selectionEnd >= codeStart) && // Selection overlaps with code block
          (selectionStart !== selectionEnd); // There's an actual selection (not just cursor)

        if (cursorInside || selectionOverlaps) {
          // Cursor is inside or code block is selected - don't add widget or hiding
          // Show the raw code so user can see/edit/copy it
          return;
        }

        // Cursor is outside - show the diagram widget and hide code
        const widgetKey = `mermaid-widget-${codeStart}`;
        const hideKey = `mermaid-hide-${codeStart}`;

        if (!decoratedRanges.has(widgetKey)) {
          // Add the widget at the start of the code block (inline widget)
          decorations.push(
            Decoration.widget({
              widget: new MermaidDiagramWidget(mermaidCode, view, codeStart, codeEnd),
              side: -1  // Place before the code block
            }).range(codeStart)
          );
          decoratedRanges.add(widgetKey);
        }

        if (!decoratedRanges.has(hideKey)) {
          // Completely replace the code block content to collapse the lines
          // This removes the vertical space that the hidden lines would otherwise take up
          decorations.push(
            Decoration.replace({}).range(codeStart, codeEnd)
          );
          decoratedRanges.add(hideKey);
        }
      }
    }

    handleLink(linkNode: SyntaxNode, view: EditorView, decorations: Range<Decoration>[], decoratedRanges: Set<string>): void {
      let linkText = '';
      let linkUrl = '';
      let linkStart = linkNode.from;
      let linkEnd = linkNode.to;

      // Get the full link text
      const fullLinkText = view.state.doc.sliceString(linkStart, linkEnd);

      // Parse link structure [text](url) manually
      const linkMatch = fullLinkText.match(/^\[([^\]]*)\]\(([^)]*)\)$/);

      if (linkMatch) {
        linkText = linkMatch[1]; // Text between [ and ]
        linkUrl = linkMatch[2];  // URL between ( and )
      }

      // Replace entire link with widget [text](url) -> clickable text
      if (linkText && linkUrl) {
        const rangeKey = `${linkStart}-${linkEnd}`;
        if (!decoratedRanges.has(rangeKey)) {
          decorations.push(
            Decoration.replace({
              widget: new LinkWidget(linkUrl, linkText)
            }).range(linkStart, linkEnd)
          );
          decoratedRanges.add(rangeKey);
        }
      }
    }

    /**
     * Handle image syntax ![alt](url)
     * Renders images inline in live preview
     */
    handleImage(imageNode: SyntaxNode, view: EditorView, decorations: Range<Decoration>[], decoratedRanges: Set<string>): void {
      let altText = '';
      let imageUrl = '';
      let imageStart = imageNode.from;
      let imageEnd = imageNode.to;

      // Parse image structure ![alt](url)
      imageNode.node.cursor().iterate((node) => {
        const nodeText = view.state.doc.sliceString(node.from, node.to);

        switch (node.type.name) {
          case 'LinkLabel':
            altText = nodeText;
            break;

          case 'URL':
            imageUrl = nodeText;
            break;
        }
      });

      // Replace entire image markdown with widget
      if (imageUrl) {
        const rangeKey = `${imageStart}-${imageEnd}`;
        if (!decoratedRanges.has(rangeKey)) {
          decorations.push(
            Decoration.replace({
              widget: new ImageWidget(imageUrl, altText || 'Image')
            }).range(imageStart, imageEnd)
          );
          decoratedRanges.add(rangeKey);
        }
      }
    }

    /**
     * Handle blockquotes and GitHub alerts
     * Detects GitHub alert syntax: > [!NOTE], > [!TIP], etc.
     */
    handleBlockquoteOrAlert(
      blockquoteNode: SyntaxNode,
      view: EditorView,
      decorations: Range<Decoration>[],
      decoratedRanges: Set<string>,
      addDecoration: (decoration: Decoration, from: number, to: number) => void
    ): void {
      const theme = getCurrentTheme();
      const from = blockquoteNode.from;
      const to = blockquoteNode.to;
      const blockquoteText = view.state.doc.sliceString(from, to);

      // Check for GitHub alert syntax: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
      const alertMatch = blockquoteText.match(/^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

      if (alertMatch) {
        const alertType = alertMatch[1].toLowerCase() as 'note' | 'tip' | 'important' | 'warning' | 'caution';
        const alertColors = theme.alert[alertType];

        // Apply GitHub alert styling
        addDecoration(
          Decoration.mark({
            class: `cm-alert cm-alert-${alertType}`,
            attributes: {
              style: `
                background-color: ${alertColors.background};
                border-left: 4px solid ${alertColors.border};
                padding: 8px 12px;
                padding-left: 1em;
                border-radius: 4px;
                margin: 8px 0;
                display: block;
              `
            }
          }),
          from,
          to
        );
      } else {
        // Regular blockquote styling
        addDecoration(
          Decoration.mark({
            class: 'cm-blockquote',
            attributes: {
              style: `
                background-color: ${theme.blockquote.background};
                color: ${theme.blockquote.text};
                padding: 2px 0;
                border-left: 4px solid ${theme.blockquote.border};
                padding-left: 1em;
              `
            }
          }),
          from,
          to
        );
      }
    }
  },
  {
    decorations: (v) => v.decorations
  }
);
