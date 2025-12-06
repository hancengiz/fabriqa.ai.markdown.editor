import { Decoration } from '@codemirror/view';
import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { MermaidDiagramWidget } from '../lib/mermaid-widget';
import { getCurrentTheme } from '../themes';

export class CodeBlockDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return ['CodeBlock', 'FencedCode', 'CodeInfo'].includes(nodeType);
    }

    decorate(context: DecorationContext): void {
        const { node, decorations, decoratedRanges, isActive, addDecoration, view } = context;
        const { from, to, type } = node;
        const theme = getCurrentTheme();

        switch (type.name) {
            case 'CodeInfo':
                // Slightly dim code block language info
                addDecoration(
                    Decoration.mark({
                        class: 'cm-code-info',
                        attributes: {
                            style: 'opacity: 0.5; font-size: 0.9em;'
                        }
                    }),
                    from,
                    to
                );
                break;

            case 'CodeBlock':
                // Add light gray background to code blocks
                addDecoration(
                    Decoration.mark({
                        class: 'cm-code-block',
                        attributes: {
                            style: `
                background-color: ${theme.code.background};
                padding: 4px 0;
                display: block;
              `
                        }
                    }),
                    from,
                    to
                );

                // Apply line-level background to each line in the code block
                const doc = view.state.doc;
                const startLine = doc.lineAt(from);
                const endLine = doc.lineAt(to);

                for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
                    const line = doc.line(lineNum);
                    const lineKey = `code-block-line-${line.from}`;
                    if (!decoratedRanges.has(lineKey)) {
                        decorations.push(
                            Decoration.line({
                                class: 'cm-code-block-line',
                                attributes: {
                                    style: `background-color: ${theme.code.background};`
                                }
                            }).range(line.from)
                        );
                        decoratedRanges.add(lineKey);
                    }
                }
                break;

            case 'FencedCode':
                // Handle Mermaid diagrams in code blocks
                this.handleMermaidDiagram(context);
                break;
        }
    }

    private handleMermaidDiagram(context: DecorationContext): void {
        const { node, decorations, decoratedRanges, isActive, view } = context;
        const theme = getCurrentTheme();
        let isMermaid = false;
        let mermaidCode = '';
        let codeStart = node.from;
        let codeEnd = node.to;

        // Parse the FencedCode structure to find CodeInfo and CodeText
        node.node.cursor().iterate((subNode) => {
            if (subNode.type.name === 'CodeInfo') {
                const lang = view.state.doc.sliceString(subNode.from, subNode.to).trim();
                isMermaid = lang === 'mermaid';
            } else if (subNode.type.name === 'CodeText') {
                mermaidCode = view.state.doc.sliceString(subNode.from, subNode.to);
            }
        });

        // If this is NOT a mermaid code block, add background styling
        if (!isMermaid) {
            const rangeKey = `code-block-${codeStart}`;
            if (!decoratedRanges.has(rangeKey)) {
                // Apply background to the entire code block range
                decorations.push(
                    Decoration.mark({
                        class: 'cm-code-block',
                        attributes: {
                            style: `
                background-color: ${theme.code.background};
                padding: 4px 0;
                display: block;
              `
                        }
                    }).range(codeStart, codeEnd)
                );
                decoratedRanges.add(rangeKey);

                // Apply line-level background to each line in the code block
                const doc = view.state.doc;
                const startLine = doc.lineAt(codeStart);
                const endLine = doc.lineAt(codeEnd);

                for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
                    const line = doc.line(lineNum);
                    const lineKey = `code-block-line-${line.from}`;
                    if (!decoratedRanges.has(lineKey)) {
                        decorations.push(
                            Decoration.line({
                                class: 'cm-code-block-line',
                                attributes: {
                                    style: `background-color: ${theme.code.background};`
                                }
                            }).range(line.from)
                        );
                        decoratedRanges.add(lineKey);
                    }
                }
            }
            return;
        }

        // If this is a mermaid code block, check if active
        if (isMermaid && mermaidCode) {
            if (isActive) {
                // Cursor is inside or code block is selected - don't add widget or hiding
                // Show the raw code so user can see/edit/copy it
                return;
            }

            // Cursor is outside - show the diagram widget and hide code
            const widgetKey = `mermaid-widget-${codeStart}`;
            const hideKey = `mermaid-hide-${codeStart}`;

            if (!decoratedRanges.has(widgetKey)) {
                // Add the widget at the start of the code block (inline widget)
                decorations.push(
                    Decoration.widget({
                        widget: new MermaidDiagramWidget(mermaidCode, view, codeStart, codeEnd),
                        side: -1  // Place before the code block
                    }).range(codeStart)
                );
                decoratedRanges.add(widgetKey);
            }

            if (!decoratedRanges.has(hideKey)) {
                // Hide the code block content using CSS instead of replacing
                // (Decoration.replace() doesn't work with multi-line content)
                decorations.push(
                    Decoration.mark({
                        class: 'cm-mermaid-hidden',
                        attributes: {
                            style: 'display: none;'
                        }
                    }).range(codeStart, codeEnd)
                );
                decoratedRanges.add(hideKey);
            }
        }
    }
}
