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

        // Sanitize HTML to prevent XSS
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'em', 'u', 's',
            'a', 'ul', 'ol', 'li',
            'blockquote', 'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img', 'hr'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
        });

        // Create or update HTML container
        if (!this.htmlContainer) {
          this.htmlContainer = document.createElement('div');
          this.htmlContainer.className = 'reading-mode-content';
          this.htmlContainer.style.cssText = `
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
            color: var(--vscode-editor-foreground);
          `;

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
  }
);
