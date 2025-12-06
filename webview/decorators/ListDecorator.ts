import { Decoration } from '@codemirror/view';
import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { CheckboxWidget } from '../widgets/CheckboxWidget';
import { getCurrentTheme } from '../themes';

export class ListDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return ['ListMark', 'TaskMarker'].includes(nodeType);
    }

    decorate(context: DecorationContext): void {
        const { node, decorations, isActive, addDecoration, decoratedRanges, view } = context;
        const { from, to, type } = node;
        const nodeText = view.state.doc.sliceString(from, to);
        const theme = getCurrentTheme();

        switch (type.name) {
            case 'ListMark':
                addDecoration(
                    Decoration.mark({
                        class: 'cm-list-mark',
                        attributes: {
                            style: `
                color: ${theme.fgColor.accent};
                font-weight: bold;
              `
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'TaskMarker':
                // Replace task list checkboxes with clickable widgets
                // Safety check: ensure checkbox text doesn't contain newlines
                if (nodeText.includes('\n')) {
                    break;
                }

                // Don't replace if active
                if (isActive) {
                    break;
                }

                const isChecked = nodeText.toLowerCase().includes('x');
                const rangeKey = `${from}-${to}`;
                if (!decoratedRanges.has(rangeKey)) {
                    decorations.push(
                        Decoration.replace({
                            widget: new CheckboxWidget(isChecked, view, from)
                        }).range(from, to)
                    );
                    decoratedRanges.add(rangeKey);
                }
                break;
        }
    }
}
