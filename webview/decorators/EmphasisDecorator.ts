import { Decoration } from '@codemirror/view';
import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { getCurrentTheme } from '../themes';

export class EmphasisDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return ['EmphasisMark', 'StrikethroughMark', 'Strikethrough', 'InlineCode', 'CodeMark'].includes(nodeType);
    }

    decorate(context: DecorationContext): void {
        const { node, isActive, addDecoration, view } = context;
        const { from, to, type } = node;
        const nodeText = view.state.doc.sliceString(from, to);
        const theme = getCurrentTheme();

        // Hidden decoration for marks
        const hiddenDecoration = Decoration.mark({ class: 'cm-md-hidden' });

        switch (type.name) {
            case 'EmphasisMark':
                // Hide emphasis marks (*, **, _, __) - matches any combination
                if (!isActive && nodeText.match(/^[*_]+$/)) {
                    addDecoration(hiddenDecoration, from, to);
                }
                break;

            case 'StrikethroughMark':
                // Hide strikethrough marks (~~)
                if (!isActive && nodeText.match(/^~~$/)) {
                    addDecoration(hiddenDecoration, from, to);
                }
                break;

            case 'Strikethrough':
                // Apply strikethrough styling
                addDecoration(
                    Decoration.mark({
                        class: 'cm-strikethrough',
                        attributes: {
                            style: 'text-decoration: line-through !important;'
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'CodeMark':
                // Hide inline code marks (`)
                if (!isActive) {
                    addDecoration(hiddenDecoration, from, to);
                }
                break;

            case 'InlineCode':
                // Style inline code
                addDecoration(
                    Decoration.mark({
                        class: 'cm-inline-code-preview',
                        attributes: {
                            style: `
                background-color: ${theme.code.inlineBackground};
                padding: 2px 4px;
                border-radius: 3px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
              `
                        }
                    }),
                    from,
                    to
                );
                break;
        }
    }
}
