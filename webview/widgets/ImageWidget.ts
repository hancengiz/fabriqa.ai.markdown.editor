import { WidgetType, EditorView } from '@codemirror/view';

/**
 * Widget for rendering images in Live Preview
 * Displays images inline with alt text fallback
 */
export class ImageWidget extends WidgetType {
    constructor(
        readonly url: string,
        readonly alt: string,
        readonly view?: EditorView,
        readonly pos?: number
    ) {
        super();
    }

    toDOM() {
        const wrapper = document.createElement('span');
        wrapper.className = 'cm-image-wrapper';
        wrapper.style.cssText = `
      display: block;
      max-width: 100%;
      margin: 8px 0;
      cursor: pointer;
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

        // Add click handler to place cursor on the image line
        if (this.view && this.pos !== undefined) {
            wrapper.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Place cursor at the image position to trigger edit mode
                // Line-based detection will show markdown when cursor is on the line
                this.view!.dispatch({
                    selection: { anchor: this.pos! }
                });
                this.view!.focus();
            });
        }

        wrapper.appendChild(img);
        return wrapper;
    }

    ignoreEvent(event: Event) {
        // Return true to tell the editor we handle these events ourselves
        if (this.view && this.pos !== undefined) {
            return event.type === 'mousedown';
        }
        return false;
    }
}
