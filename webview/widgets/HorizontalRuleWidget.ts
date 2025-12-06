import { WidgetType } from '@codemirror/view';
import { getCurrentTheme } from '../themes';

/**
 * Widget for horizontal rules in Live Preview
 * Renders a styled horizontal line
 */
export class HorizontalRuleWidget extends WidgetType {
    toDOM() {
        const theme = getCurrentTheme();
        const hr = document.createElement('hr');
        hr.className = 'cm-horizontal-rule';
        hr.style.cssText = `
      display: block;
      width: 100%;
      border: none;
      border-bottom: 2px solid ${theme.borderColor.muted};
      margin: 4px 0;
      opacity: 0.6;
    `;
        return hr;
    }

    ignoreEvent() {
        return false;
    }
}
