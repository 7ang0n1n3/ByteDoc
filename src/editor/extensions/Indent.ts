import { Extension } from '@tiptap/core';
import type { CommandProps } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      increaseIndent: () => ReturnType;
      decreaseIndent: () => ReturnType;
    };
  }
}

const INDENT_TYPES = new Set(['paragraph', 'heading']);
const MIN_INDENT = 0;
const MAX_INDENT = 8;

function clampIndent(value: number) {
  return Math.min(MAX_INDENT, Math.max(MIN_INDENT, value));
}

export const IndentExtension = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const value = element.getAttribute('data-indent');
              return value ? clampIndent(Number.parseInt(value, 10) || 0) : 0;
            },
            renderHTML: (attributes) => {
              const indent = clampIndent(Number(attributes.indent) || 0);
              if (!indent) return {};
              return {
                'data-indent': indent,
                style: `margin-left: ${indent * 2}rem`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const updateIndent =
      (delta: number) =>
      ({ state, dispatch }: CommandProps) => {
        const { from, to } = state.selection;
        const tr = state.tr;
        let changed = false;

        state.doc.nodesBetween(from, to, (node: ProseMirrorNode, pos: number) => {
          if (!INDENT_TYPES.has(node.type.name)) return;

          const currentIndent = Number(node.attrs.indent) || 0;
          const nextIndent = clampIndent(currentIndent + delta);
          if (nextIndent === currentIndent) return;

          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            indent: nextIndent,
          });
          changed = true;
        });

        if (changed && dispatch) {
          dispatch(tr.scrollIntoView());
        }

        return changed;
      };

    return {
      increaseIndent: () => updateIndent(1),
      decreaseIndent: () => updateIndent(-1),
    };
  },
});
