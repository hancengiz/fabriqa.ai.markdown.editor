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
