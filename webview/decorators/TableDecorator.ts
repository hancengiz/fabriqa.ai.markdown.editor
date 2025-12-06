import { Decoration } from '@codemirror/view';
import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { TableWidget } from '../widgets/TableWidget';

export class TableDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return nodeType === 'Table';
    }

    decorate(context: DecorationContext): void {
        const { node, decorations, decoratedRanges, isActive, view } = context;
        const from = node.from;
        const to = node.to;
        const tableText = view.state.doc.sliceString(from, to);
        const cursorPos = view.state.selection.main.head;
        const selection = view.state.selection.main;

        // Check if cursor is inside this table OR if table is part of selection
        const cursorInside = cursorPos >= from && cursorPos <= to;
        const selectionOverlaps =
            (selection.from <= to && selection.to >= from) &&
            (selection.from !== selection.to);

        // If cursor is inside or table is selected, show raw markdown
        if (cursorInside || selectionOverlaps) {
            return;
        }

        // Otherwise, render HTML table widget and hide the markdown
        const widgetKey = `table-widget-${from}`;
        const hideKey = `table-hide-${from}`;

        if (!decoratedRanges.has(widgetKey)) {
            // Add the table widget at the start
            decorations.push(
                Decoration.widget({
                    widget: new TableWidget(tableText),
                    side: -1  // Place before the table
                }).range(from)
            );
            decoratedRanges.add(widgetKey);
        }

        if (!decoratedRanges.has(hideKey)) {
            // Hide the table markdown using CSS
            decorations.push(
                Decoration.mark({
                    class: 'cm-table-hidden',
                    attributes: {
                        style: 'display: none;'
                    }
                }).range(from, to)
            );
            decoratedRanges.add(hideKey);
        }
    }
}
