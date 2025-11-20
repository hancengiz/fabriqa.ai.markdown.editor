import { Decoration } from '@codemirror/view';
import { Range } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { isNodeWithinNode } from './cursor-detection';

/**
 * Create decoration for hiding markdown syntax markers
 * @param cssClass CSS class to apply
 * @returns Decoration that hides markers
 */
export function createHiddenDecoration(cssClass: string = 'cm-md-hidden'): Decoration {
  return Decoration.mark({
    class: cssClass,
    attributes: {
      'aria-hidden': 'true',
    },
  });
}

/**
 * Check if a node should be decorated (hidden)
 * @param node Node to check
 * @param activeStructure Currently active structure (contains cursor)
 * @param hiddenNodes List of node types to hide
 * @returns true if node should be hidden
 */
export function shouldHideNode(
  node: SyntaxNode,
  activeStructure: SyntaxNode | null,
  hiddenNodes: string[]
): boolean {
  // Skip decorating if node is within the active structure
  if (activeStructure && isNodeWithinNode(node, activeStructure)) {
    return false;
  }

  // Check if this is a node type we want to hide
  return hiddenNodes.includes(node.type.name);
}

/**
 * Apply decoration to a node
 * @param node Node to decorate
 * @param decoration Decoration to apply
 * @param decorations Array to push decoration to
 */
export function applyDecoration(
  node: SyntaxNode,
  decoration: Decoration,
  decorations: Range<Decoration>[]
): void {
  decorations.push(decoration.range(node.from, node.to));
}

/**
 * Process a syntax node and apply decorations if needed
 * @param node Syntax node to process
 * @param activeStructure Currently active structure
 * @param hiddenNodes List of node types to hide
 * @param decoration Decoration to apply
 * @param decorations Array to collect decorations
 * @returns false to skip children, true to continue
 */
export function processNode(
  node: any,
  activeStructure: SyntaxNode | null,
  hiddenNodes: string[],
  decoration: Decoration,
  decorations: Range<Decoration>[]
): boolean {
  // Skip decorating nodes within the active structure entirely
  if (activeStructure && isNodeWithinNode(node.node, activeStructure)) {
    return false; // Skip this node and all its children
  }

  // Check if we should hide this node
  if (shouldHideNode(node.node, activeStructure, hiddenNodes)) {
    applyDecoration(node.node, decoration, decorations);
  }

  return true; // Continue processing children
}
