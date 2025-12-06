import { WidgetType } from '@codemirror/view';

/**
 * Widget for emoji shortcodes in Live Preview
 * Renders :emoji_name: as actual emoji character
 */
export class EmojiWidget extends WidgetType {
    constructor(readonly emoji: string) {
        super();
    }

    toDOM() {
        const span = document.createElement('span');
        span.textContent = this.emoji;
        span.className = 'cm-emoji';
        span.style.cssText = `
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    `;
        return span;
    }

    ignoreEvent() {
        return false;
    }
}
