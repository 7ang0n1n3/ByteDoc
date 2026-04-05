// src/editor/extensions/FigureCaption.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { v4 as uuid } from 'uuid';

export const FigureCaptionNode = Node.create({
  name: 'figureCaption',
  group: 'block',
  content: 'inline*',
  defining: true,
  selectable: false,

  addAttributes() {
    return {
      figureId: { default: () => uuid() },
    };
  },

  parseHTML() {
    return [{ tag: 'p[data-figure-caption]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-figure-caption': '',
        class: 'figure-caption',
      }),
      0,
    ];
  },
});
