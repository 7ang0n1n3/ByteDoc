// src/editor/extensions/PageBreak.ts
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      insertPageBreak: () => ReturnType;
    };
  }
}

export const PageBreakNode = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,   // no inner content; acts as a single unit
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break' })];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name })
            .command(({ tr, dispatch }) => {
              // Move cursor to a new paragraph after the page break
              if (dispatch) {
                const pos = tr.selection.$to.pos;
                tr.insert(pos, this.type.schema.nodes.paragraph.create());
              }
              return true;
            })
            .run();
        },
    };
  },
});
