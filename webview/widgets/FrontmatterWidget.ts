import { WidgetType, EditorView } from '@codemirror/view';

interface FrontmatterWidgetConfig {
    rawContent: string;
    view: EditorView;
    startPos: number;
}

// Simple YAML parser to avoid runtime dependencies issues
function simpleYamlLoad(text: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = text.split('\n');
    let currentKey: string | null = null;
    let currentList: string[] | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // List item
        if (trimmed.startsWith('- ')) {
            if (currentList && currentKey) {
                currentList.push(trimmed.substring(2));
            }
            continue;
        }

        // Key-value pair
        const match = trimmed.match(/^([^:]+):\s*(.*)$/);
        if (match) {
            const key = match[1].trim();
            const valueStr = match[2].trim();

            // Start of list?
            if (!valueStr) {
                currentKey = key;
                currentList = [];
                result[key] = currentList;
                continue;
            }

            // Primitive value
            let value: any = valueStr;

            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            } else if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            } else if (!isNaN(Number(value))) {
                value = Number(value);
            }

            result[key] = value;
            currentKey = null; // Reset current list context
            currentList = null;
        }
    }
    return result;
}

export class FrontmatterWidget extends WidgetType {
    private rawContent: string;
    private parsedContent: Record<string, any> | null = null;
    private view: EditorView;
    private startPos: number;

    constructor({ rawContent, view, startPos }: FrontmatterWidgetConfig) {
        super();
        this.rawContent = rawContent;
        this.view = view;
        this.startPos = startPos;

        try {
            const cleanContent = this.rawContent.replace(/^---\n/, '').replace(/\n---$/, '');
            this.parsedContent = simpleYamlLoad(cleanContent);
        } catch (e) {
            console.warn('Failed to parse frontmatter', e);
            this.parsedContent = null;
        }
    }

    toDOM(view: EditorView): HTMLElement {
        const container = document.createElement('div');
        container.className = 'cm-frontmatter-widget';
        container.style.backgroundColor = 'var(--vscode-sideBar-background)'; // Distinct bg
        container.style.borderBottom = '1px solid var(--vscode-editorGroup-border)';
        container.style.marginBottom = '10px';

        // Header
        const header = document.createElement('div');
        header.className = 'cm-frontmatter-header';
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.padding = '4px 8px';
        header.style.color = 'var(--vscode-descriptionForeground)'; // Use theme color

        // SVG for Arrow Right
        const arrowRightSvg = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;
        // SVG for Arrow Down
        const arrowDownSvg = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;

        const iconContainer = document.createElement('span');
        iconContainer.style.display = 'inline-flex';
        iconContainer.style.width = '16px';
        iconContainer.style.height = '16px';
        iconContainer.style.marginRight = '4px';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.innerHTML = arrowRightSvg; // Default collapsed

        const title = document.createElement('span');
        title.textContent = 'Properties';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '0.9em';

        header.appendChild(iconContainer);
        header.appendChild(title);
        container.appendChild(header);

        if (this.parsedContent) {
            const body = this.renderPropertiesTable();
            // Hidden by default
            body.style.display = 'none';
            container.appendChild(body);

            header.onclick = (e) => {
                e.stopPropagation();
                const isExpanded = body.style.display !== 'none';
                if (isExpanded) {
                    // Collapse
                    body.style.display = 'none';
                    iconContainer.innerHTML = arrowRightSvg;
                    container.classList.remove('expanded');
                } else {
                    // Expand
                    body.style.display = 'block';
                    iconContainer.innerHTML = arrowDownSvg;
                    container.classList.add('expanded');
                }
            };
        }

        return container;
    }

    private renderPropertiesTable(): HTMLElement {
        const table = document.createElement('div');
        table.className = 'cm-frontmatter-table';
        table.style.padding = '4px 12px 12px 28px';

        if (!this.parsedContent) return table;

        Object.entries(this.parsedContent).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'baseline'; // Better alignment for multiline values
            row.style.marginBottom = '6px';
            row.style.fontSize = '0.9em';
            row.style.lineHeight = '1.4';

            const keyCol = document.createElement('div');
            keyCol.style.width = '120px';
            keyCol.style.flexShrink = '0';
            keyCol.style.color = 'var(--vscode-descriptionForeground)';
            keyCol.style.display = 'flex';
            keyCol.style.alignItems = 'center';
            keyCol.style.paddingRight = '10px';

            // Generic property icon
            const propIcon = `<svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M2 4h12v2H2V4zm0 6h8v2H2v-2z" opacity="0.7"/></svg>`;
            const keyIconSpan = document.createElement('span');
            keyIconSpan.style.marginRight = '6px';
            keyIconSpan.style.display = 'inline-flex';
            keyIconSpan.style.opacity = '0.7';
            keyIconSpan.innerHTML = propIcon;

            keyCol.appendChild(keyIconSpan);
            keyCol.appendChild(document.createTextNode(key));

            const valCol = document.createElement('div');
            valCol.style.flexGrow = '1';
            valCol.style.display = 'flex';
            valCol.style.flexWrap = 'wrap';
            valCol.style.gap = '6px';
            valCol.style.color = 'var(--vscode-editor-foreground)';

            if (Array.isArray(value)) {
                if (value.length === 0) {
                    const empty = document.createElement('span');
                    empty.textContent = 'Empty list';
                    empty.style.opacity = '0.5';
                    empty.style.fontStyle = 'italic';
                    valCol.appendChild(empty);
                } else {
                    value.forEach(v => {
                        const tag = document.createElement('span');
                        tag.className = 'cm-frontmatter-pill';
                        tag.textContent = String(v);
                        tag.style.backgroundColor = 'var(--vscode-textCodeBlock-background)';
                        tag.style.color = 'var(--vscode-textPreformat-foreground)';
                        // Fallback colors if vars not available
                        if (!tag.style.color) tag.style.color = 'inherit';

                        tag.style.padding = '2px 6px';
                        tag.style.borderRadius = '4px';
                        tag.style.fontSize = '0.9em';
                        tag.style.border = '1px solid var(--vscode-widget-border)';
                        valCol.appendChild(tag);
                    });
                }

            } else if (typeof value === 'boolean') {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = value;
                checkbox.disabled = true; // Read only
                // Style it to look native/nice
                checkbox.style.margin = '0';
                checkbox.style.verticalAlign = 'middle';
                valCol.appendChild(checkbox);
            } else {
                valCol.textContent = String(value);
            }

            row.appendChild(keyCol);
            row.appendChild(valCol);
            table.appendChild(row);
        });

        return table;
    }

    eq(other: FrontmatterWidget): boolean {
        return other.rawContent === this.rawContent && other.startPos === this.startPos;
    }

    ignoreEvent() { return true; }
}
