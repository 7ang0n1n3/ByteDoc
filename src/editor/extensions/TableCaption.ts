// src/editor/extensions/TableCaption.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { v4 as uuid } from 'uuid';

export const TableCaptionNode = Node.create({
  name: 'tableCaption',
  group: 'block',
  content: 'inline*',
  defining: true,
  selectable: false,

  addAttributes() {
    return {
      captionId: { default: () => uuid() },
    };
  },

  parseHTML() {
    return [{ tag: 'p[data-table-caption]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-table-caption': '',
        class: 'table-caption',
      }),
      0,
    ];
  },
});
