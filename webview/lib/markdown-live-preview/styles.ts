import { EditorView } from '@codemirror/view';

/**
 * Theme styles for hiding markdown syntax markers
 *
 * TEMPORARY: Using display: none to test if decorations are working
 * TODO: Switch back to safe approach after confirming decorations work
 */
export const markdownHidingStyles = EditorView.theme({
  '.cm-md-hidden': {
    display: 'none !important',
  },
  // Hide frontmatter lines completely
  '.cm-frontmatter-hidden-line': {
    display: 'none !important',
  },
  // First line of frontmatter: show widget but hide the "---" text
  '.cm-frontmatter-first-line': {
    fontSize: '0 !important',
    lineHeight: '0 !important',
    height: 'auto !important',
    overflow: 'visible !important',
  },
  // But show the widget inside the first line
  '.cm-frontmatter-first-line .cm-frontmatter-widget': {
    fontSize: '14px !important',
    lineHeight: '1.4 !important',
    display: 'block !important',
  },
  // Hide the actual text content (the "---")
  '.cm-frontmatter-first-line > span': {
    display: 'none !important',
  },
  '.cm-frontmatter-first-line > br': {
    display: 'none !important',
  },
  '.cm-frontmatter-first-line > img.cm-widgetBuffer': {
    display: 'none !important',
  },
});

/**
 * Safe CSS approach (currently disabled for testing)
 * Uses font-size/letter-spacing instead of display: none
 */
export const markdownHidingStylesSafe = EditorView.theme({
  '.cm-md-hidden': {
    fontSize: '1px !important',
    letterSpacing: '-1ch',
    color: 'transparent',
    fontFamily: 'monospace',
  },
});

/**
 * Alternative theme with display: none
 * WARNING: This may break cursor placement in some cases
 * Only use if you've tested thoroughly in your environment
 */
export const markdownHidingStylesDisplayNone = EditorView.theme({
  '.cm-md-hidden': {
    display: 'none',
  },
});
