/**
 * Markdown Live Preview Library
 *
 * A reusable CodeMirror 6 plugin for hiding markdown syntax markers
 * while maintaining an editable view (Obsidian-style Live Preview).
 *
 * @module markdown-live-preview
 * @author Fabriqa AI Team
 * @license MIT
 */

export { createMarkdownLivePreview } from './plugin';
export { markdownHidingStyles, markdownHidingStylesDisplayNone } from './styles';
export type { MarkdownLivePreviewConfig } from './types';
export { DEFAULT_CONFIG } from './types';

// Re-export utility functions for advanced usage
export {
  isCursorInNode,
  isNodeWithinNode,
  findActiveStructure,
} from './cursor-detection';

export {
  createHiddenDecoration,
  shouldHideNode,
  applyDecoration,
  processNode,
} from './decorations';
