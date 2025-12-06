import { Decoration } from '@codemirror/view';
import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { ImageWidget } from '../widgets/ImageWidget';

export class ImageDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return nodeType === 'Image';
    }

    decorate(context: DecorationContext): void {
        const { node, decorations, decoratedRanges, isActive, view } = context;

        let altText = '';
        let imageUrl = '';
        const imageStart = node.from;
        const imageEnd = node.to;

        // Get the full image text to check for newlines
        const fullImageText = view.state.doc.sliceString(imageStart, imageEnd);

        // Skip if image contains newlines (can't use Decoration.replace on multi-line content)
        if (fullImageText.includes('\n')) {
            return;
        }

        // Parse image structure ![alt](url)
        node.cursor().iterate((subNode) => {
            const nodeText = view.state.doc.sliceString(subNode.from, subNode.to);

            switch (subNode.type.name) {
                case 'LinkLabel':
                    altText = nodeText;
                    break;

                case 'URL':
                    imageUrl = nodeText;
                    break;
            }
        });

        if (!imageUrl) return;

        const rangeKey = `${imageStart}-${imageEnd}`;

        // Use LINE-BASED detection like checkboxes do
        // If cursor is anywhere on the same line as the image, show raw markdown
        // Also check if cursor is within or at the image range (for when clicking on image widget)
        const cursorPos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(imageStart);
        const isLineActive = view.hasFocus && (cursorPos >= line.from && cursorPos <= line.to);
        // Also activate if cursor is at image position (e.g., after clicking widget)
        const isCursorAtImage = view.hasFocus && (cursorPos >= imageStart && cursorPos <= imageEnd);
        const shouldShowMarkdown = isLineActive || isCursorAtImage || isActive;

        if (shouldShowMarkdown) {
            // Cursor is on the same line or within image - show markdown syntax AND rendered image
            // Add widget after the markdown text (not replacing it) - same as original
            const widgetKey = `${imageStart}-${imageEnd}-widget`;
            if (!decoratedRanges.has(widgetKey)) {
                decorations.push(
                    Decoration.widget({
                        widget: new ImageWidget(imageUrl, altText || 'Image'),
                        side: 1  // Place after the image markdown
                    }).range(imageEnd)
                );
                decoratedRanges.add(widgetKey);
            }
            return; // Don't add replace decoration
        } else {
            // Cursor is outside - replace entire image markdown with widget (hide markdown)
            // Pass view and position so clicking the image can place cursor to enter edit mode
            if (!decoratedRanges.has(rangeKey)) {
                decorations.push(
                    Decoration.replace({
                        widget: new ImageWidget(imageUrl, altText || 'Image', view, imageStart)
                    }).range(imageStart, imageEnd)
                );
                decoratedRanges.add(rangeKey);
            }
        }
    }
}
