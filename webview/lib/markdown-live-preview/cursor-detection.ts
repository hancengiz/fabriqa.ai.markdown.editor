import { SyntaxNode } from '@lezer/common';

/**
 * Inline structure types that require strict cursor containment
 */
const INLINE_STRUCTURES = [
  'Emphasis',
  'StrongEmphasis',
  'Link',
  'InlineCode',
  'Strikethrough',
];

/**
 * Check if cursor is within a node
 * @param cursorPos Current cursor position
 * @param node Syntax node to check
 * @param strictInline If true, inline structures require cursor to be strictly inside (not at boundary)
 * @returns true if cursor is within the node
 */
export function isCursorInNode(
  cursorPos: number,
  node: SyntaxNode,
  strictInline: boolean = true
): boolean {
  const isInlineStructure = INLINE_STRUCTURES.includes(node.type.name);

  if (isInlineStructure && strictInline) {
    // For inline: cursor must be strictly inside, not at the boundary
    return cursorPos > node.from && cursorPos < node.to;
  } else {
    // For block-level: cursor can be at boundary
    return cursorPos >= node.from && cursorPos <= node.to;
  }
}

/**
 * Check if a node is completely contained within another node
 * @param child Node to check
 * @param parent Container node
 * @returns true if child is within parent
 */
export function isNodeWithinNode(child: SyntaxNode, parent: SyntaxNode): boolean {
  return child.from >= parent.from && child.to <= parent.to;
}

/**
 * Find the smallest (most specific) structure containing the cursor
 * @param tree Syntax tree to search
 * @param cursorPos Current cursor position
 * @param elementNodes List of node types to consider as elements
 * @param strictInline Whether to use strict cursor containment for inline elements
 * @returns The active structure node, or null if none found
 */
export function findActiveStructure(
  tree: any,
  cursorPos: number,
  elementNodes: string[],
  strictInline: boolean = true
): SyntaxNode | null {
  let activeStructure: SyntaxNode | null = null;

  tree.iterate({
    enter: (node: any) => {
      // Check if cursor is within this node
      if (!isCursorInNode(cursorPos, node.node, strictInline)) {
        return false; // Don't explore this branch
      }

      // Check if this is a structure type we care about
      if (elementNodes.includes(node.type.name)) {
        // Keep the smallest (most specific) structure
        const nodeSize = node.to - node.from;
        const activeSize = activeStructure ? activeStructure.to - activeStructure.from : Infinity;

        if (nodeSize < activeSize) {
          activeStructure = node.node;
        }
      }

      return true; // Continue exploring children
    },
  });

  return activeStructure;
}
