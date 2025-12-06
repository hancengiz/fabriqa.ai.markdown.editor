import { WidgetType } from '@codemirror/view';

/**
 * Widget for GitHub alert icons in Live Preview
 * Renders icon at the start of alert blocks
 */
export class AlertIconWidget extends WidgetType {
    constructor(readonly icon: string) {
        super();
    }

    toDOM() {
        const span = document.createElement('span');
        span.textContent = this.icon + ' ';
        span.className = 'cm-alert-icon';
        span.style.cssText = `
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      margin-right: 4px;
    `;
        return span;
    }

    ignoreEvent() {
        return false;
    }
}

/**
 * Widget for GitHub alert title in Live Preview
 * Renders icon and title like "ℹ️ Note", "💡 Tip", etc.
 */
export class AlertTitleWidget extends WidgetType {
    constructor(readonly icon: string, readonly title: string, readonly color: string) {
        super();
    }

    toDOM() {
        const wrapper = document.createElement('div');
        wrapper.className = 'cm-alert-title';
        wrapper.style.cssText = `
      font-weight: 600;
      margin-bottom: 4px;
      color: ${this.color};
    `;

        const icon = document.createElement('span');
        icon.textContent = this.icon + ' ';
        icon.style.cssText = `
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      margin-right: 4px;
    `;

        const title = document.createElement('span');
        title.textContent = this.title;

        wrapper.appendChild(icon);
        wrapper.appendChild(title);
        return wrapper;
    }

    ignoreEvent() {
        return false;
    }
}
