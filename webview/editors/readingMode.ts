import { ViewPlugin, EditorView } from '@codemirror/view';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Reading Mode Plugin
 * Renders markdown as HTML (read-only view)
 */
export const readingModePlugin = ViewPlugin.fromClass(
  class {
    private htmlContainer: HTMLDivElement | null = null;
    private view: EditorView | null = null;

    constructor(view: EditorView) {
      this.view = view;
      this.renderHTML(view);
    }

    update(update: any) {
      if (update.docChanged) {
        this.renderHTML(update.view);
      }
    }

    destroy() {
      // Restore CodeMirror content visibility
      if (this.view) {
        const cmContent = this.view.dom.querySelector('.cm-content');
        if (cmContent) {
          (cmContent as HTMLElement).style.display = '';
        }
      }

      // Remove HTML container
      if (this.htmlContainer) {
        this.htmlContainer.remove();
        this.htmlContainer = null;
      }

      this.view = null;
    }

    renderHTML(view: EditorView) {
      const markdown = view.state.doc.toString();

      try {
        // Convert markdown to HTML
        const rawHtml = marked.parse(markdown) as string;

        // Sanitize HTML to prevent XSS (allow input for checkboxes)
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'em', 'u', 's',
            'a', 'ul', 'ol', 'li',
            'blockquote', 'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img', 'hr', 'input'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'type', 'checked', 'disabled']
        });

        // Create or update HTML container
        if (!this.htmlContainer) {
          this.htmlContainer = document.createElement('div');
          this.htmlContainer.className = 'reading-mode-content';

          // Apply comprehensive styling
          const style = document.createElement('style');
          style.textContent = `
            .reading-mode-content {
              padding: 40px 60px;
              max-width: 900px;
              margin: 0 auto;
              line-height: 1.8;
              color: var(--vscode-editor-foreground);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 16px;
            }

            .reading-mode-content h1 {
              font-size: 2.5em;
              font-weight: 600;
              margin: 0.67em 0;
              padding-bottom: 0.3em;
              border-bottom: 1px solid #e1e4e8;
              color: var(--vscode-editor-foreground);
            }

            .reading-mode-content h2 {
              font-size: 2em;
              font-weight: 600;
              margin: 0.75em 0 0.5em 0;
              padding-bottom: 0.3em;
              border-bottom: 1px solid #e1e4e8;
              color: var(--vscode-editor-foreground);
            }

            .reading-mode-content h3 {
              font-size: 1.5em;
              font-weight: 600;
              margin: 0.83em 0 0.5em 0;
              color: var(--vscode-editor-foreground);
            }

            .reading-mode-content h4 {
              font-size: 1.25em;
              font-weight: 600;
              margin: 1em 0 0.5em 0;
              color: var(--vscode-editor-foreground);
            }

            .reading-mode-content h5, .reading-mode-content h6 {
              font-size: 1em;
              font-weight: 600;
              margin: 1em 0 0.5em 0;
              color: var(--vscode-editor-foreground);
            }

            .reading-mode-content p {
              margin: 1em 0;
            }

            .reading-mode-content strong {
              font-weight: 600;
              color: var(--vscode-editor-foreground);
            }

            .reading-mode-content em {
              font-style: italic;
            }

            .reading-mode-content a {
              color: var(--vscode-textLink-foreground, #006ab1);
              text-decoration: none;
            }

            .reading-mode-content a:hover {
              text-decoration: underline;
            }

            .reading-mode-content code {
              font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
              background-color: var(--vscode-textCodeBlock-background, #f5f5f5);
              padding: 0.2em 0.4em;
              border-radius: 3px;
              font-size: 0.9em;
            }

            .reading-mode-content pre {
              background-color: var(--vscode-textCodeBlock-background, #f5f5f5);
              padding: 16px;
              border-radius: 6px;
              overflow-x: auto;
              margin: 1em 0;
              line-height: 1.45;
            }

            .reading-mode-content pre code {
              background: none;
              padding: 0;
              font-size: 0.85em;
            }

            .reading-mode-content ul, .reading-mode-content ol {
              margin: 1em 0;
              padding-left: 2em;
            }

            .reading-mode-content li {
              margin: 0.25em 0;
            }

            .reading-mode-content blockquote {
              margin: 1em 0;
              padding: 0 1em;
              border-left: 4px solid #ddd;
              color: #666;
            }

            .reading-mode-content hr {
              border: none;
              border-top: 1px solid #e1e4e8;
              margin: 2em 0;
            }

            .reading-mode-content table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }

            .reading-mode-content th, .reading-mode-content td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
            }

            .reading-mode-content th {
              background-color: #f5f5f5;
              font-weight: 600;
            }

            .reading-mode-content img {
              max-width: 100%;
              height: auto;
            }

            /* Task list checkboxes */
            .reading-mode-content input[type="checkbox"] {
              cursor: pointer;
              margin-right: 8px;
            }

            .reading-mode-content li:has(> input[type="checkbox"]) {
              list-style: none;
              margin-left: -2em;
            }
          `;
          document.head.appendChild(style);

          // Hide CodeMirror content
          const cmContent = view.dom.querySelector('.cm-content');
          if (cmContent) {
            (cmContent as HTMLElement).style.display = 'none';
          }

          // Append HTML container
          view.dom.appendChild(this.htmlContainer);
        }

        // Update content
        this.htmlContainer.innerHTML = cleanHtml;

        // Make checkboxes interactive
        this.setupCheckboxHandlers(view);

        // Make links clickable with Cmd/Ctrl+Click
        this.setupLinkHandlers(view);
      } catch (error) {
        console.error('Failed to render markdown:', error);
        if (this.htmlContainer) {
          this.htmlContainer.innerHTML = `
            <div style="color: var(--vscode-errorForeground); padding: 20px;">
              <strong>Error rendering markdown:</strong> ${error}
            </div>
          `;
        }
      }
    }

    /**
     * Setup click handlers for checkboxes in reading mode
     * Allows toggling task list items by clicking checkboxes
     */
    setupCheckboxHandlers(view: EditorView) {
      if (!this.htmlContainer) return;

      const checkboxes = this.htmlContainer.querySelectorAll('input[type="checkbox"]');

      checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent default to handle manually

          const isChecked = (checkbox as HTMLInputElement).checked;
          const newChecked = !isChecked;

          // Find the checkbox in the markdown source
          const doc = view.state.doc;
          let checkboxCount = 0;

          for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
            const line = doc.line(lineNum);
            const lineText = line.text;

            // Check if this line has a checkbox (with or without list marker)
            // Support [ ], [], and [x] patterns
            if (lineText.match(/^(\s*)(?:[-*+]\s)?\[(?:\s|x|X|)\]/)) {
              if (checkboxCount === index) {
                // This is the checkbox we clicked
                const newLine = newChecked
                  ? lineText.replace(/\[(?:\s|)\]/, '[x]')
                  : lineText.replace(/\[x\]/i, '[ ]');

                view.dispatch({
                  changes: {
                    from: line.from,
                    to: line.to,
                    insert: newLine
                  }
                });
                return;
              }
              checkboxCount++;
            }
          }
        });
      });
    }

    /**
     * Setup click handlers for links in reading mode
     * Allows opening markdown files with Cmd/Ctrl+Click
     */
    setupLinkHandlers(view: EditorView) {
      if (!this.htmlContainer) return;

      const links = this.htmlContainer.querySelectorAll('a[href]');

      links.forEach((link) => {
        link.addEventListener('click', (e) => {
          const mouseEvent = e as MouseEvent;

          // Only handle Cmd/Ctrl+Click
          if (mouseEvent.metaKey || mouseEvent.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();

            const href = (link as HTMLAnchorElement).getAttribute('href');
            if (href) {
              // Send message to VS Code to open the file
              const vscode = (window as any).acquireVsCodeApi?.() || (window as any).vscode;
              if (vscode) {
                vscode.postMessage({
                  type: 'openLink',
                  url: href
                });
              }
            }
          }
        });
      });
    }
  }
);
