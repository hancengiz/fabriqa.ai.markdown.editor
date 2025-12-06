import { WidgetType } from '@codemirror/view';
import { getCurrentTheme } from '../themes';

/**
 * Widget for rendering HTML tables in Live Preview
 * Shows beautiful HTML when viewing, raw markdown when editing
 * This is a hybrid approach: better than Obsidian's markdown-only view
 */
export class TableWidget extends WidgetType {
    constructor(readonly markdownText: string) {
        super();
    }

    toDOM() {
        try {
            const theme = getCurrentTheme();
            const wrapper = document.createElement('div');
            wrapper.className = 'cm-table-wrapper';
            wrapper.style.cssText = `
        display: block;
        overflow-x: auto;
        margin: 8px 0;
      `;

            const table = this.parseMarkdownTable(this.markdownText);
            if (table) {
                const tableElement = this.createHTMLTable(table, theme);
                wrapper.appendChild(tableElement);
            } else {
                // If parsing fails, show raw markdown
                const pre = document.createElement('pre');
                pre.textContent = this.markdownText;
                pre.style.cssText = `
          font-family: monospace;
          white-space: pre-wrap;
        `;
                wrapper.appendChild(pre);
            }

            return wrapper;
        } catch (error) {
            console.error('[TableWidget] Error rendering table:', error);
            // Return fallback element on error
            const fallback = document.createElement('div');
            fallback.textContent = '[Table rendering error]';
            fallback.style.cssText = `
        color: #d1242f;
        font-style: italic;
        padding: 4px 8px;
        background-color: #ffebe9;
        border-radius: 4px;
      `;
            return fallback;
        }
    }

    parseMarkdownTable(markdown: string): { headers: string[], alignments: string[], rows: string[][] } | null {
        const lines = markdown.trim().split('\n');
        if (lines.length < 2) return null;

        // Parse header row
        const headers = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell);

        // Parse alignment row
        const alignmentLine = lines[1];
        const alignmentCells = alignmentLine.split('|').map(cell => cell.trim()).filter(cell => cell);
        const alignments = alignmentCells.map(cell => {
            if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
            if (cell.endsWith(':')) return 'right';
            return 'left';
        });

        // Parse data rows
        const rows: string[][] = [];
        for (let i = 2; i < lines.length; i++) {
            const cells = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell);
            if (cells.length > 0) {
                rows.push(cells);
            }
        }

        return { headers, alignments, rows };
    }

    createHTMLTable(table: { headers: string[], alignments: string[], rows: string[][] }, theme: any): HTMLElement {
        const tableEl = document.createElement('table');
        tableEl.style.cssText = `
      border-collapse: collapse;
      width: 100%;
      border: 1px solid ${theme.borderColor.muted};
      background-color: ${theme.editor.background};
      font-size: inherit;
    `;

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        table.headers.forEach((header, i) => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.cssText = `
        border: 1px solid ${theme.borderColor.muted};
        padding: 8px 12px;
        text-align: ${table.alignments[i] || 'left'};
        background-color: ${theme.code.background};
        font-weight: 600;
        color: ${theme.editor.foreground};
      `;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        tableEl.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        table.rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach((cell, i) => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.style.cssText = `
          border: 1px solid ${theme.borderColor.muted};
          padding: 8px 12px;
          text-align: ${table.alignments[i] || 'left'};
          color: ${theme.editor.foreground};
        `;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        tableEl.appendChild(tbody);

        return tableEl;
    }

    ignoreEvent() {
        return false;
    }
}
