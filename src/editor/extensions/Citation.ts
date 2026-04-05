// src/editor/extensions/Citation.ts
import { Node, mergeAttributes } from '@tiptap/core';

export const CitationNode = Node.create({
  name: 'citation',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      refId:   { default: null },
      refNum:  { default: null }, // display number, e.g. 1
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-citation]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-citation': node.attrs.refId,
        class: 'citation-ref',
        contenteditable: 'false',
      }),
      `[${node.attrs.refNum ?? '?'}]`,
    ];
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citation: {
      insertCitation: (refId: string, refNum: number) => ReturnType;
    };
  }
}

// We add the command separately to avoid circular type issues
CitationNode.extend({
  addCommands() {
    return {
      insertCitation:
        (refId: string, refNum: number) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'citation',
            attrs: { refId, refNum },
          });
        },
    };
  },
});
