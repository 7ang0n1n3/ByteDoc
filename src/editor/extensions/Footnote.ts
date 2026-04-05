// src/editor/extensions/Footnote.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { v4 as uuid } from 'uuid';

export const FootnoteNode = Node.create({
  name: 'footnote',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      footnoteId: { default: () => uuid() },
      content:    { default: '' },
      number:     { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'sup[data-footnote]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        'data-footnote': node.attrs.footnoteId,
        class: 'footnote-ref',
        title: node.attrs.content,
        contenteditable: 'false',
      }),
      node.attrs.number?.toString() ?? '*',
    ];
  },
});
