import { WidgetType } from '@codemirror/view';
import { getCurrentTheme } from '../themes';

/**
 * Widget for clickable links in Live Preview
 * Supports Cmd/Ctrl+Click to open markdown files
 */
export class LinkWidget extends WidgetType {
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
