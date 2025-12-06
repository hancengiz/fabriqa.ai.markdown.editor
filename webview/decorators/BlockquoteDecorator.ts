import { Decoration } from '@codemirror/view';
import { INodeDecorator, DecorationContext } from '../interfaces/interfaces';
import { AlertIconWidget, AlertTitleWidget } from '../widgets/AlertWidgets';
import { getCurrentTheme } from '../themes';

export class BlockquoteDecorator implements INodeDecorator {
    canDecorate(nodeType: string): boolean {
        return ['Blockquote', 'QuoteMark'].includes(nodeType);
    }

    decorate(context: DecorationContext): void {
        const { node, decorations, decoratedRanges, isActive, addDecoration, view } = context;
        const { from, to, type } = node;

        // Hidden decoration for marks
        const hiddenDecoration = Decoration.mark({ class: 'cm-md-hidden' });

        if (type.name === 'QuoteMark') {
            // Skip QuoteMark styling - it's handled by Blockquote styling
            // to avoid decoration conflicts
            return;
        }

        if (type.name === 'Blockquote') {
            this.handleBlockquoteOrAlert(context);
        }
    }

    private handleBlockquoteOrAlert(context: DecorationContext): void {
        const { node, decorations, decoratedRanges, isActive, addDecoration, view } = context;
        const theme = getCurrentTheme();
        const from = node.from;
        const to = node.to;
        const blockquoteText = view.state.doc.sliceString(from, to);

        // Hidden decoration for marks
        const hiddenDecoration = Decoration.mark({ class: 'cm-md-hidden' });

        // Check for GitHub alert syntax: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
        // Match at start of blockquote text, accounting for multi-line blockquotes
        const alertMatch = blockquoteText.match(/^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

        if (alertMatch && !isActive) {
            const alertType = alertMatch[1].toLowerCase() as 'note' | 'tip' | 'important' | 'warning' | 'caution';

            // Safely access alert colors with fallback
            const alertColors = theme.alert?.[alertType];

            if (!alertColors) {
                console.warn(`[livePreviewMode] Alert colors not found for type: ${alertType}`);
                return;
            }

            // Icon mapping for each alert type
            const alertIcons: Record<string, string> = {
                'note': 'ℹ️',
                'tip': '💡',
                'important': '❗',
                'warning': '⚠️',
                'caution': '⚠️'
            };

            // Title mapping for each alert type
            const alertTitles: Record<string, string> = {
                'note': 'Note',
                'tip': 'Tip',
                'important': 'Important',
                'warning': 'Warning',
                'caution': 'Caution'
            };

            // Apply GitHub alert styling as line decorations for continuous border
            const doc = view.state.doc;
            const startLine = doc.lineAt(from);
            const endLine = doc.lineAt(to);

            for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
                const line = doc.line(lineNum);
                const lineKey = `alert-line-${alertType}-${line.from}`;
                const isLastLine = lineNum === endLine.number;

                if (!decoratedRanges.has(lineKey)) {
                    decorations.push(
                        Decoration.line({
                            class: `cm-alert-line cm-alert-${alertType}`,
                            attributes: {
                                style: `
                  border-left: 0.25em solid ${alertColors.border};
                  padding-left: 1em;
                  ${isLastLine ? 'padding-bottom: 1em;' : ''}
                `
                            }
                        }).range(line.from)
                    );
                    decoratedRanges.add(lineKey);
                }
            }

            // Hide ALL quote markers (>) in the alert block
            const lines = blockquoteText.split('\n');
            let currentPos = from;

            for (const line of lines) {
                const quoteMatch = line.match(/^(\s*)(>)(\s*)/);
                if (quoteMatch) {
                    const quoteStart = currentPos + quoteMatch[1].length;
                    const quoteEnd = quoteStart + 1; // Just the '>' character

                    const quoteKey = `quote-mark-${quoteStart}`;
                    if (!decoratedRanges.has(quoteKey)) {
                        decorations.push(hiddenDecoration.range(quoteStart, quoteEnd));
                        decoratedRanges.add(quoteKey);
                    }
                }
                currentPos += line.length + 1; // +1 for the newline character
            }

            // Find and replace [!TYPE] with title widget showing icon + title text
            const alertTagPattern = `[!${alertType.toUpperCase()}]`;
            const alertTagIndex = blockquoteText.indexOf(alertTagPattern);

            if (alertTagIndex !== -1) {
                const alertTagStart = from + alertTagIndex;
                const alertTagEnd = alertTagStart + alertTagPattern.length;

                const titleKey = `alert-title-${alertTagStart}`;
                if (!decoratedRanges.has(titleKey)) {
                    // Replace the [!TYPE] text with the title widget (icon + title + color)
                    decorations.push(
                        Decoration.replace({
                            widget: new AlertTitleWidget(alertIcons[alertType], alertTitles[alertType], alertColors.border)
                        }).range(alertTagStart, alertTagEnd)
                    );
                    decoratedRanges.add(titleKey);
                }
            }
        } else if (!isActive) {
            // Regular blockquote styling (only if cursor is outside)
            // Check for embedded code blocks and handle them specially
            this.handleBlockquoteWithCodeBlocks(context, blockquoteText, from, to);
        }
    }

    /**
     * Handle regular blockquotes, including those with embedded code blocks
     * Detects fenced code blocks within blockquote text and applies appropriate styling
     */
    private handleBlockquoteWithCodeBlocks(
        context: DecorationContext,
        blockquoteText: string,
        from: number,
        to: number
    ): void {
        const { decorations, decoratedRanges, view } = context;
        const theme = getCurrentTheme();
        const hiddenDecoration = Decoration.mark({ class: 'cm-md-hidden' });
        const doc = view.state.doc;

        // Get cursor position for line-based edit mode detection
        const cursorPos = view.state.selection.main.head;
        const cursorLine = view.hasFocus ? doc.lineAt(cursorPos) : null;

        // Parse the blockquote to find embedded code blocks
        // Pattern: lines starting with > followed by ``` (with optional language)
        const lines = blockquoteText.split('\n');
        let currentPos = from;
        let inCodeBlock = false;
        let codeBlockStartLine = -1;
        let codeBlockLang = '';
        const codeBlockLines: { lineNum: number; from: number; to: number; text: string }[] = [];

        // First pass: identify code block regions
        interface CodeBlockRegion {
            startPos: number;
            endPos: number;
            lang: string;
            lines: { lineNum: number; from: number; to: number; text: string }[];
        }
        const codeBlockRegions: CodeBlockRegion[] = [];
        let currentRegion: CodeBlockRegion | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineFrom = currentPos;
            const lineTo = currentPos + line.length;
            const docLine = doc.lineAt(lineFrom);

            // Check if line starts a code fence: > ```lang or > ```
            const fenceStartMatch = line.match(/^>\s*```(\w*)\s*$/);
            const fenceEndMatch = line.match(/^>\s*```\s*$/);

            if (!inCodeBlock && fenceStartMatch) {
                // Start of code block
                inCodeBlock = true;
                codeBlockLang = fenceStartMatch[1] || '';
                codeBlockStartLine = i;
                currentRegion = {
                    startPos: lineFrom,
                    endPos: lineTo,
                    lang: codeBlockLang,
                    lines: [{ lineNum: docLine.number, from: lineFrom, to: lineTo, text: line }]
                };
            } else if (inCodeBlock && fenceEndMatch && i !== codeBlockStartLine) {
                // End of code block
                if (currentRegion) {
                    currentRegion.lines.push({ lineNum: docLine.number, from: lineFrom, to: lineTo, text: line });
                    currentRegion.endPos = lineTo;
                    codeBlockRegions.push(currentRegion);
                }
                inCodeBlock = false;
                currentRegion = null;
            } else if (inCodeBlock && currentRegion) {
                // Inside code block
                currentRegion.lines.push({ lineNum: docLine.number, from: lineFrom, to: lineTo, text: line });
                currentRegion.endPos = lineTo;
            }

            currentPos += line.length + 1; // +1 for newline
        }

        // Apply decorations
        const startLine = doc.lineAt(from);
        const endLine = doc.lineAt(to);
        currentPos = from;

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const line = lines[lineIdx];
            const lineFrom = currentPos;
            const lineTo = currentPos + line.length;
            const docLine = doc.lineAt(lineFrom);

            // Check if this line is inside a code block region
            const inCodeRegion = codeBlockRegions.find(region =>
                lineFrom >= region.startPos && lineTo <= region.endPos
            );

            // Check if this is a fence line (start or end)
            const isFenceStart = line.match(/^>\s*```\w*\s*$/);
            const isFenceEnd = line.match(/^>\s*```\s*$/) && !isFenceStart;

            // Check if cursor is on this line (for edit mode)
            const isLineActive = cursorLine && docLine.number === cursorLine.number;

            if (inCodeRegion) {
                // This line is part of a code block
                const lineKey = `blockquote-code-line-${lineFrom}`;

                // Check if cursor is anywhere in this code block region (for showing all raw markdown)
                const isCursorInCodeRegion = cursorLine && inCodeRegion &&
                    cursorLine.from >= doc.lineAt(inCodeRegion.startPos).from &&
                    cursorLine.to <= doc.lineAt(inCodeRegion.endPos).to;

                if (!decoratedRanges.has(lineKey)) {
                    if (isCursorInCodeRegion) {
                        // Cursor is somewhere in this code block - show raw markdown for ALL lines
                        // Don't hide anything, just add subtle styling
                        decorations.push(
                            Decoration.line({
                                class: 'cm-blockquote-code-line-active',
                                attributes: {
                                    style: `
                                        background-color: ${theme.code.background};
                                        border-left: 4px solid ${theme.blockquote.border};
                                        padding-left: 0.5em;
                                    `
                                }
                            }).range(docLine.from)
                        );
                    } else if (isFenceStart) {
                        // Opening fence line - show language label instead of hiding
                        const lang = inCodeRegion.lang || '';
                        if (lang) {
                            // Show language label with styling
                            decorations.push(
                                Decoration.line({
                                    class: 'cm-blockquote-code-fence-start',
                                    attributes: {
                                        style: `
                                            background-color: ${theme.code.background};
                                            border-left: 4px solid ${theme.blockquote.border};
                                            padding-left: 1em;
                                            font-size: 0.85em;
                                            color: ${theme.fgColor.muted};
                                            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
                                        `
                                    }
                                }).range(docLine.from)
                            );

                            // Hide the > ``` part, show only the language
                            const fenceMatch = line.match(/^(>\s*```)/);
                            if (fenceMatch) {
                                const hideStart = lineFrom;
                                const hideEnd = lineFrom + fenceMatch[1].length;
                                const hideKey = `blockquote-fence-hide-${hideStart}`;
                                if (!decoratedRanges.has(hideKey)) {
                                    decorations.push(hiddenDecoration.range(hideStart, hideEnd));
                                    decoratedRanges.add(hideKey);
                                }
                            }
                        } else {
                            // No language - hide the entire fence line
                            decorations.push(
                                Decoration.line({
                                    class: 'cm-blockquote-code-fence',
                                    attributes: {
                                        style: `
                                            height: 0;
                                            overflow: hidden;
                                            padding: 0;
                                            margin: 0;
                                            line-height: 0;
                                            font-size: 0;
                                        `
                                    }
                                }).range(docLine.from)
                            );
                        }
                    } else if (isFenceEnd) {
                        // Closing fence line - hide it
                        decorations.push(
                            Decoration.line({
                                class: 'cm-blockquote-code-fence',
                                attributes: {
                                    style: `
                                        height: 0;
                                        overflow: hidden;
                                        padding: 0;
                                        margin: 0;
                                        line-height: 0;
                                        font-size: 0;
                                    `
                                }
                            }).range(docLine.from)
                        );
                    } else {
                        // Code content line - apply code block styling
                        decorations.push(
                            Decoration.line({
                                class: 'cm-blockquote-code-line',
                                attributes: {
                                    style: `
                                        background-color: ${theme.code.background};
                                        border-left: 4px solid ${theme.blockquote.border};
                                        padding-left: 1em;
                                        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
                                    `
                                }
                            }).range(docLine.from)
                        );

                        // Hide the > marker at the start of the line
                        const quoteMatch = line.match(/^(>)(\s*)/);
                        if (quoteMatch) {
                            const quoteStart = lineFrom;
                            const quoteEnd = lineFrom + quoteMatch[1].length + quoteMatch[2].length;
                            const quoteKey = `blockquote-code-marker-${quoteStart}`;
                            if (!decoratedRanges.has(quoteKey)) {
                                decorations.push(hiddenDecoration.range(quoteStart, quoteEnd));
                                decoratedRanges.add(quoteKey);
                            }
                        }
                    }
                    decoratedRanges.add(lineKey);
                }
            } else {
                // Regular blockquote line (not in code block)
                const lineKey = `blockquote-line-${lineFrom}`;

                if (!decoratedRanges.has(lineKey)) {
                    if (isLineActive) {
                        // Cursor is on this line - show raw markdown (edit mode)
                        decorations.push(
                            Decoration.line({
                                class: 'cm-blockquote-line-active',
                                attributes: {
                                    style: `
                                        background-color: ${theme.blockquote.background};
                                        border-left: 4px solid ${theme.blockquote.border};
                                        padding-left: 0.5em;
                                    `
                                }
                            }).range(docLine.from)
                        );
                    } else {
                        decorations.push(
                            Decoration.line({
                                class: 'cm-blockquote-line',
                                attributes: {
                                    style: `
                                        background-color: ${theme.blockquote.background};
                                        color: ${theme.blockquote.text};
                                        border-left: 4px solid ${theme.blockquote.border};
                                        padding-left: 1em;
                                    `
                                }
                            }).range(docLine.from)
                        );

                        // Hide the > marker
                        const quoteMatch = line.match(/^(>)(\s?)/);
                        if (quoteMatch) {
                            const quoteStart = lineFrom;
                            const quoteEnd = lineFrom + quoteMatch[1].length + (quoteMatch[2]?.length || 0);
                            const quoteKey = `blockquote-marker-${quoteStart}`;
                            if (!decoratedRanges.has(quoteKey)) {
                                decorations.push(hiddenDecoration.range(quoteStart, quoteEnd));
                                decoratedRanges.add(quoteKey);
                            }
                        }
                    }
                    decoratedRanges.add(lineKey);
                }
            }

            currentPos += line.length + 1;
        }
    }
}
