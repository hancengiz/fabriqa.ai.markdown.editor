import { Decoration } from '@codemirror/view';
import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';

export class HeadingDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return [
            'ATXHeading1', 'ATXHeading2', 'ATXHeading3',
            'ATXHeading4', 'ATXHeading5', 'ATXHeading6',
            'HeaderMark'
        ].includes(nodeType);
    }

    decorate(context: DecorationContext): void {
        const { node, decorations, isActive, addDecoration } = context;
        const { from, to, type } = node;
        const nodeText = context.view.state.doc.sliceString(from, to);

        // Hidden decoration for marks
        const hiddenDecoration = Decoration.mark({ class: 'cm-md-hidden' });

        switch (type.name) {
            case 'ATXHeading1':
                addDecoration(
                    Decoration.mark({
                        class: 'cm-heading-1',
                        attributes: {
                            style: 'font-size: 2em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'ATXHeading2':
                addDecoration(
                    Decoration.mark({
                        class: 'cm-heading-2',
                        attributes: {
                            style: 'font-size: 1.5em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'ATXHeading3':
                addDecoration(
                    Decoration.mark({
                        class: 'cm-heading-3',
                        attributes: {
                            style: 'font-size: 1.25em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'ATXHeading4':
                addDecoration(
                    Decoration.mark({
                        class: 'cm-heading-4',
                        attributes: {
                            style: 'font-size: 1em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'ATXHeading5':
                addDecoration(
                    Decoration.mark({
                        class: 'cm-heading-5',
                        attributes: {
                            style: 'font-size: 0.875em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'ATXHeading6':
                addDecoration(
                    Decoration.mark({
                        class: 'cm-heading-6',
                        attributes: {
                            style: 'font-size: 0.85em; font-weight: 600; line-height: 1.25; text-decoration: none !important; border-bottom: none !important;'
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'HeaderMark':
                if (!isActive && nodeText.match(/^#+\s?$/)) {
                    addDecoration(hiddenDecoration, from, to);
                }
                break;
        }
    }
}
