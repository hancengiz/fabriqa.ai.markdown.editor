/**
 * Configuration options for the Markdown Live Preview plugin
 */
export interface MarkdownLivePreviewConfig {
  /**
   * Node types to consider as elements (show markers when cursor is inside)
   */
  elementNodes?: string[];

  /**
   * Node types to hide (markers like **, __, etc.)
   */
  hiddenNodes?: string[];

  /**
   * CSS class to apply for hiding markers
   * Default: 'cm-md-hidden'
   */
  hiddenClass?: string;

  /**
   * Whether to use strict cursor containment for inline elements
   * If true, cursor must be strictly inside (not at boundary)
   * Default: true
   */
  strictInlineCursor?: boolean;
}

/**
 * Default configuration for Markdown Live Preview
 */
export const DEFAULT_CONFIG: Required<MarkdownLivePreviewConfig> = {
  elementNodes: [
    // Block-level structures
    'FencedCode',
    'CodeBlock',
    'ATXHeading1',
    'ATXHeading2',
    'ATXHeading3',
    'ATXHeading4',
    'ATXHeading5',
    'ATXHeading6',
    'Blockquote',
    'ListItem',
    // Inline structures
    'Emphasis',
    'StrongEmphasis',
    'Link',
    'InlineCode',
    'Strikethrough',
  ],
  hiddenNodes: [
    'HardBreak',
    'LinkMark',
    'EmphasisMark',
    'StrongEmphasisMark',
    'CodeMark',
    'CodeInfo',
    'URL',
    'HeaderMark',
  ],
  hiddenClass: 'cm-md-hidden',
  strictInlineCursor: true,
};
