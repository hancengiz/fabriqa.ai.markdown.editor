import { MarkdownConfig } from '@lezer/markdown';

export const yamlFrontmatter: MarkdownConfig = {
    defineNodes: [{ name: 'Frontmatter', block: true }],
    parseBlock: [{
        name: 'Frontmatter',
        parse(cx, line) {
            if (cx.lineStart !== 0) {
                return false;
            }

            // Allow trailing whitespace
            const startFence = line.text.match(/^---\s*$/);
            if (!startFence) {
                return false;
            }

            const from = cx.lineStart;
            let end = -1;

            // Advance to next line
            if (!cx.nextLine()) return false;

            // Scan for closing delimiter
            do {
                if (line.text.match(/^---\s*$/)) { // Check for closing fence
                    end = cx.lineStart + line.text.length;
                    cx.nextLine(); // Consume the closing line
                    break;
                }
            } while (cx.nextLine());

            if (end < 0) return false;

            cx.addElement(cx.elt('Frontmatter', from, end));
            return true;
        },
        before: 'HorizontalRule'
    }]
};
