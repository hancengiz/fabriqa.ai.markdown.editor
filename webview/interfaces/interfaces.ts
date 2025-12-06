import { Decoration, EditorView } from '@codemirror/view';
import { SyntaxNode } from '@lezer/common';
import { Range } from '@codemirror/state';

export interface DecorationContext {
    node: SyntaxNode;
    view: EditorView;
    decorations: Range<Decoration>[];
    decoratedRanges: Set<string>;
    isActive: boolean;
    addDecoration: (decoration: Decoration, from: number, to: number) => void;
}

export interface INodeDecorator {
    canDecorate(nodeType: string): boolean;
    decorate(context: DecorationContext): void;
}
