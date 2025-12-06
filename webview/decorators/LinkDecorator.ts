import { Decoration } from '@codemirror/view';
import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { LinkWidget } from '../widgets/LinkWidget';

export class LinkDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return nodeType === 'Link';
    }

    decorate(context: DecorationContext): void {
        const { node, decorations, decoratedRanges, isActive, view } = context;

        if (isActive) return;

        let linkText = '';
        let linkUrl = '';
        let linkStart = node.from;
        let linkEnd = node.to;

        // Get the full link text
        const fullLinkText = view.state.doc.sliceString(linkStart, linkEnd);

        // Skip if link contains newlines (can't use Decoration.replace on multi-line content)
        if (fullLinkText.includes('\n')) {
            return;
        }

        // Parse link structure [text](url) manually
        const linkMatch = fullLinkText.match(/^\[([^\]]*)\]\(([^)]*)\)$/);

        if (linkMatch) {
            linkText = linkMatch[1]; // Text between [ and ]
            linkUrl = linkMatch[2];  // URL between ( and )
        }

        // Replace entire link with widget [text](url) -> clickable text
        if (linkText && linkUrl) {
            const rangeKey = `${linkStart}-${linkEnd}`;
            if (!decoratedRanges.has(rangeKey)) {
                decorations.push(
                    Decoration.replace({
                        widget: new LinkWidget(linkUrl, linkText)
                    }).range(linkStart, linkEnd)
                );
                decoratedRanges.add(rangeKey);
            }
        }
    }
}
