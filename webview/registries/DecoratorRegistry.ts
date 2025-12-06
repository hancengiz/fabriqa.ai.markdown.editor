import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { HeadingDecorator } from '../decorators/HeadingDecorator';
import { ListDecorator } from '../decorators/ListDecorator';
import { EmphasisDecorator } from '../decorators/EmphasisDecorator';
import { LinkDecorator } from '../decorators/LinkDecorator';
import { ImageDecorator } from '../decorators/ImageDecorator';
import { CodeBlockDecorator } from '../decorators/CodeBlockDecorator';
import { TableDecorator } from '../decorators/TableDecorator';
import { BlockquoteDecorator } from '../decorators/BlockquoteDecorator';
import { HorizontalRuleWidget } from '../widgets/HorizontalRuleWidget';
import { Decoration } from '@codemirror/view';

export class DecoratorRegistry {
    private decorators: INodeDecorator[] = [];

    constructor() {
        this.registerDecorators();
    }

    private registerDecorators() {
        this.decorators.push(new HeadingDecorator());
        this.decorators.push(new ListDecorator());
        this.decorators.push(new EmphasisDecorator());
        this.decorators.push(new LinkDecorator());
        this.decorators.push(new ImageDecorator());
        this.decorators.push(new CodeBlockDecorator());
        this.decorators.push(new TableDecorator());
        this.decorators.push(new BlockquoteDecorator());

        // Horizontal Rule is simple enough to handle with a generic decorator or just here for now?
        // Actually, let's create a simple inline decorator for HR since it was part of the switch
        this.decorators.push({
            canDecorate: (type) => type === 'HorizontalRule',
            decorate: (context) => {
                const { node, decorations, decoratedRanges, isActive, view } = context;
                const { from, to } = node;

                if (isActive) return;

                const hrText = view.state.doc.sliceString(from, to);
                if (hrText.includes('\n')) return;

                const hrKey = `${from}-${to}`;
                if (!decoratedRanges.has(hrKey)) {
                    // Hide blank lines logic was in the original, but for simplicity let's stick to the widget replacement first
                    // The blank line hiding logic is a bit complex and might belong in a specific HR decorator if we want to keep it.
                    // Let's implement the basic replacement first.

                    // Re-implementing the blank line hiding logic here as it was in the original
                    // Hide ALL consecutive blank lines immediately before the HR
                    const hrLine = view.state.doc.lineAt(from);
                    let lineNum = hrLine.number - 1;
                    while (lineNum >= 1) {
                        const line = view.state.doc.line(lineNum);
                        if (line.text.trim() === '') {
                            const lineKey = `hr-blank-before-${line.from}`;
                            if (!decoratedRanges.has(lineKey)) {
                                decorations.push(
                                    Decoration.line({
                                        attributes: { style: 'display: none;' }
                                    }).range(line.from)
                                );
                                decoratedRanges.add(lineKey);
                            }
                            lineNum--;
                        } else {
                            break; // Stop at first non-blank line
                        }
                    }

                    // Hide ALL consecutive blank lines immediately after the HR
                    lineNum = hrLine.number + 1;
                    while (lineNum <= view.state.doc.lines) {
                        const line = view.state.doc.line(lineNum);
                        if (line.text.trim() === '') {
                            const lineKey = `hr-blank-after-${line.from}`;
                            if (!decoratedRanges.has(lineKey)) {
                                decorations.push(
                                    Decoration.line({
                                        attributes: { style: 'display: none;' }
                                    }).range(line.from)
                                );
                                decoratedRanges.add(lineKey);
                            }
                            lineNum++;
                        } else {
                            break; // Stop at first non-blank line
                        }
                    }

                    decorations.push(
                        Decoration.replace({
                            widget: new HorizontalRuleWidget()
                        }).range(from, to)
                    );
                    decoratedRanges.add(hrKey);
                }
            }
        });
    }

    public decorate(context: DecorationContext): void {
        const nodeType = context.node.type.name;
        for (const decorator of this.decorators) {
            if (decorator.canDecorate(nodeType)) {
                decorator.decorate(context);
                // We don't break here because multiple decorators might apply to the same node type (though unlikely with current design)
                // But for performance and logic, usually one decorator per node type is enough.
                // However, the original code had a switch, so it was mutually exclusive.
                // Let's keep it that way.
                break;
            }
        }
    }
}
