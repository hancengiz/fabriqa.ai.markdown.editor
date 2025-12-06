import { WidgetType, EditorView } from '@codemirror/view';
import { getCurrentTheme } from '../themes';

/**
 * Widget for clickable checkboxes in Live Preview
 * Renders an actual HTML checkbox that can be clicked to toggle state
 */
export class CheckboxWidget extends WidgetType {
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
