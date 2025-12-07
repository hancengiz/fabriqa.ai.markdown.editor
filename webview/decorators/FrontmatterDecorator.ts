import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { Decoration, WidgetType, EditorView } from '@codemirror/view';

/**
 * Frontmatter widget that displays as a collapsible "Properties" panel
 */
class FrontmatterBlockWidget extends WidgetType {
    constructor(
        private rawContent: string,
        private editorView: EditorView,
        private startPos: number
    ) {
        super();
    }

    toDOM(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'cm-frontmatter-widget';
        container.style.backgroundColor = 'var(--vscode-sideBar-background)';
        container.style.borderBottom = '1px solid var(--vscode-editorGroup-border)';
        container.style.marginBottom = '10px';
        container.style.display = 'block';

        // Parse the YAML content
        const parsedContent = this.parseYaml();

        // Header with collapse toggle
        const header = document.createElement('div');
        header.className = 'cm-frontmatter-header';
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.padding = '4px 8px';
        header.style.color = 'var(--vscode-descriptionForeground)';

        // Arrow icons
        const arrowRightSvg = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;
        const arrowDownSvg = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;

        const iconContainer = document.createElement('span');
        iconContainer.style.display = 'inline-flex';
        iconContainer.style.width = '16px';
        iconContainer.style.height = '16px';
        iconContainer.style.marginRight = '4px';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.innerHTML = arrowRightSvg;

        const title = document.createElement('span');
        title.textContent = 'Properties';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '0.9em';

        header.appendChild(iconContainer);
        header.appendChild(title);
        container.appendChild(header);

        // Body with properties
        if (parsedContent && Object.keys(parsedContent).length > 0) {
            const body = this.renderPropertiesTable(parsedContent);
            body.style.display = 'none';
            container.appendChild(body);

            header.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const isExpanded = body.style.display !== 'none';
                if (isExpanded) {
                    body.style.display = 'none';
                    iconContainer.innerHTML = arrowRightSvg;
                } else {
                    body.style.display = 'block';
                    iconContainer.innerHTML = arrowDownSvg;
                }
            };
        }

        return container;
    }

    private parseYaml(): Record<string, any> | null {
        try {
            const cleanContent = this.rawContent.replace(/^---\n?/, '').replace(/\n?---$/, '');
            const result: Record<string, any> = {};
            const lines = cleanContent.split('\n');
            let currentKey: string | null = null;
            let currentList: string[] | null = null;
            let currentMultiline: string[] | null = null;
            let multilineIndent: number = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();

                // Skip empty lines and comments (unless in multiline mode)
                if (!trimmed || trimmed.startsWith('#')) {
                    if (currentMultiline && currentKey) {
                        // Empty line in multiline - add paragraph break
                        currentMultiline.push('');
                    }
                    continue;
                }

                // Check if we're collecting multiline content
                if (currentMultiline && currentKey) {
                    const lineIndent = line.search(/\S/);
                    if (lineIndent >= multilineIndent) {
                        // This is continuation of multiline
                        currentMultiline.push(trimmed);
                        continue;
                    } else {
                        // End of multiline block - save it
                        result[currentKey] = currentMultiline.join(' ').trim();
                        currentMultiline = null;
                        currentKey = null;
                        multilineIndent = 0;
                    }
                }

                // List item (with proper indentation check)
                if (/^\s*-\s+/.test(line) && currentList && currentKey) {
                    const itemMatch = line.match(/^\s*-\s+(.*)$/);
                    if (itemMatch) {
                        currentList.push(itemMatch[1]);
                    }
                    continue;
                }

                // Key-value pair
                const match = trimmed.match(/^([^:]+):\s*(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const valueStr = match[2].trim();

                    // Check for multiline indicators (>- or | or >)
                    if (valueStr === '>-' || valueStr === '>' || valueStr === '|' || valueStr === '|-') {
                        currentKey = key;
                        currentMultiline = [];
                        currentList = null;
                        // Next line's indentation will be the baseline
                        multilineIndent = 2; // Default indent for YAML multiline
                        continue;
                    }

                    if (!valueStr) {
                        currentKey = key;
                        currentList = [];
                        result[key] = currentList;
                        currentMultiline = null;
                        continue;
                    }

                    let value: any = valueStr;
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length - 1);
                    } else if (value === 'true') {
                        value = true;
                    } else if (value === 'false') {
                        value = false;
                    } else if (!isNaN(Number(value)) && value !== '') {
                        value = Number(value);
                    }

                    result[key] = value;
                    currentKey = null;
                    currentList = null;
                    currentMultiline = null;
                }
            }

            // Handle any remaining multiline content
            if (currentMultiline && currentKey) {
                result[currentKey] = currentMultiline.join(' ').trim();
            }

            return result;
        } catch (e) {
            console.warn('Failed to parse frontmatter YAML:', e);
            return null;
        }
    }

    private renderPropertiesTable(parsedContent: Record<string, any>): HTMLElement {
        const table = document.createElement('div');
        table.className = 'cm-frontmatter-table';
        table.style.padding = '4px 12px 12px 28px';

        // Find line positions for each key in the raw content
        const keyPositions = this.findKeyPositions();

        Object.entries(parsedContent).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'baseline';
            row.style.marginBottom = '6px';
            row.style.fontSize = '0.9em';
            row.style.lineHeight = '1.4';
            row.style.cursor = 'pointer';
            row.style.borderRadius = '4px';
            row.style.padding = '2px 4px';
            row.style.margin = '0 -4px 6px -4px';

            // Hover effect
            row.onmouseenter = () => {
                row.style.backgroundColor = 'var(--vscode-list-hoverBackground)';
            };
            row.onmouseleave = () => {
                row.style.backgroundColor = 'transparent';
            };

            // Click to edit - focus on that line in the editor
            row.onclick = (e) => {
                e.stopPropagation();
                const pos = keyPositions.get(key);
                if (pos !== undefined) {
                    this.editorView.dispatch({
                        selection: { anchor: pos },
                        scrollIntoView: true
                    });
                    this.editorView.focus();
                }
            };

            const keyCol = document.createElement('div');
            keyCol.style.width = '120px';
            keyCol.style.flexShrink = '0';
            keyCol.style.color = 'var(--vscode-descriptionForeground)';
            keyCol.style.display = 'flex';
            keyCol.style.alignItems = 'center';
            keyCol.style.paddingRight = '10px';

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
                        tag.style.color = 'var(--vscode-textPreformat-foreground, inherit)';
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
                checkbox.disabled = true;
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

    /**
     * Find the document positions for each key in the frontmatter
     */
    private findKeyPositions(): Map<string, number> {
        const positions = new Map<string, number>();
        const lines = this.rawContent.split('\n');
        let offset = this.startPos;

        for (const line of lines) {
            const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):/);
            if (match) {
                const key = match[1];
                // Position at the start of the value (after "key: ")
                const valueStart = offset + match[0].length + 1;
                positions.set(key, Math.min(valueStart, offset + line.length));
            }
            offset += line.length + 1; // +1 for newline
        }

        return positions;
    }

    eq(other: FrontmatterBlockWidget): boolean {
        return other.rawContent === this.rawContent && other.startPos === this.startPos;
    }

    // Ignore all events so clicks don't accidentally trigger edit mode
    // The property row onclick handlers explicitly dispatch to editor when needed
    ignoreEvent() { return true; }
}

export class FrontmatterDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return nodeType === 'Frontmatter';
    }

    decorate(context: DecorationContext): void {
        try {
            const { node, decorations, decoratedRanges, view, isActive } = context;
            const { from, to } = node;

            // Safety check for range
            if (from >= to || to > view.state.doc.length) {
                return;
            }

            // If cursor is inside frontmatter, show raw markdown (edit mode)
            if (isActive) {
                return;
            }

            const key = `frontmatter-${from}-${to}`;

            if (!decoratedRanges.has(key)) {
                const rawContent = view.state.doc.sliceString(from, to);
                const doc = view.state.doc;

                // Get line numbers for frontmatter block
                const startLine = doc.lineAt(from);
                const endLine = doc.lineAt(to);

                // Add widget decoration at position 0 (before first line content)
                // Place it on the first line, which we'll style to only show the widget
                decorations.push(
                    Decoration.widget({
                        widget: new FrontmatterBlockWidget(rawContent, view, from),
                        side: -1
                    }).range(from)
                );

                // First line gets special class that hides text but shows widget
                decorations.push(
                    Decoration.line({
                        class: 'cm-frontmatter-first-line'
                    }).range(startLine.from)
                );

                // Hide remaining lines in the frontmatter block
                for (let lineNum = startLine.number + 1; lineNum <= endLine.number; lineNum++) {
                    const line = doc.line(lineNum);
                    const lineKey = `frontmatter-line-${line.from}`;
                    if (!decoratedRanges.has(lineKey)) {
                        decorations.push(
                            Decoration.line({
                                class: 'cm-frontmatter-hidden-line'
                            }).range(line.from)
                        );
                        decoratedRanges.add(lineKey);
                    }
                }

                decoratedRanges.add(key);
            }
        } catch (e) {
            console.error('FrontmatterDecorator error:', e);
        }
    }
}
