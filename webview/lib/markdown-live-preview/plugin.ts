import { ViewPlugin, DecorationSet, Decoration, EditorView, ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { findActiveStructure } from './cursor-detection';
import { createHiddenDecoration, processNode } from './decorations';
import { MarkdownLivePreviewConfig, DEFAULT_CONFIG } from './types';

/**
 * Markdown Live Preview Plugin
 *
 * Hides markdown syntax markers (**, __, `, etc.) except in the specific
 * markdown element where the cursor is positioned. This provides an
 * Obsidian-style editing experience.
 *
 * @example
 * ```typescript
 * import { createMarkdownLivePreview } from './lib/markdown-live-preview';
 *
 * const livePreviewPlugin = createMarkdownLivePreview({
 *   hiddenNodes: ['EmphasisMark', 'StrongEmphasisMark'],
 *   hiddenClass: 'cm-md-hidden'
 * });
 * ```
 */
export function createMarkdownLivePreview(config: MarkdownLivePreviewConfig = {}) {
  // Merge with default config
  const mergedConfig: Required<MarkdownLivePreviewConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const hiddenDecoration = createHiddenDecoration(mergedConfig.hiddenClass);

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const decorations: Range<Decoration>[] = [];
        const cursorPos = view.state.selection.main.head;
        const tree = syntaxTree(view.state);

        // Find the active structure containing the cursor
        const activeStructure = findActiveStructure(
          tree,
          cursorPos,
          mergedConfig.elementNodes,
          mergedConfig.strictInlineCursor
        );

        // Iterate through syntax tree and apply decorations
        tree.iterate({
          enter: (node) => {
            return processNode(
              node,
              activeStructure,
              mergedConfig.hiddenNodes,
              hiddenDecoration,
              decorations
            );
          },
        });

        return Decoration.set(decorations, true);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
