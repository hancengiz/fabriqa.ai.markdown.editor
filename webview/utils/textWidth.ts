/**
 * Calculate the visual width of a string
 * Counts CJK characters and Emojis as 2 units, others as 1 unit.
 */
export function getVisualWidth(str: string): number {
    let width = 0;
    // Iterate by code point (handles surrogate pairs)
    for (const char of str) {
        // Check for CJK and Emoji ranges
        // CJK: \u4e00-\u9fa5, \u3000-\u303f, \uff01-\uff60
        // Emoji: simplified check for high code points or specific ranges
        if (char.match(/[\u4e00-\u9fa5\u3000-\u303f\uff01-\uff60]/) || (char.codePointAt(0) || 0) > 0x2E80) {
            // Broad check for non-Latin characters (CJK, Emoji, etc.)
            // 0x2E80 is start of CJK Radicals Supplement
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

/**
 * Pad a string to a target visual width with spaces
 */
export function padString(str: string, targetWidth: number): string {
    const currentWidth = getVisualWidth(str);
    if (currentWidth >= targetWidth) {
        return str;
    }
    return str + ' '.repeat(targetWidth - currentWidth);
}
