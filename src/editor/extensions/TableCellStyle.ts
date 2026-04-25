import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

const styledCellAttributes = {
  backgroundColor: {
    default: null,
    parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
    renderHTML: (attributes: { backgroundColor?: string | null }) => {
      if (!attributes.backgroundColor) return {};
      return { style: `background-color: ${attributes.backgroundColor}` };
    },
  },
  textColor: {
    default: null,
    parseHTML: (element: HTMLElement) => element.style.color || null,
    renderHTML: (attributes: { textColor?: string | null }) => {
      if (!attributes.textColor) return {};
      return { style: `color: ${attributes.textColor}` };
    },
  },
  borderStyle: {
    default: null,
    parseHTML: (element: HTMLElement) => element.style.borderStyle || null,
    renderHTML: (attributes: { borderStyle?: string | null }) => {
      if (!attributes.borderStyle) return {};
      return { style: `border-style: ${attributes.borderStyle}` };
    },
  },
};

export const StyledTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...styledCellAttributes,
    };
  },
});

export const StyledTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...styledCellAttributes,
    };
  },
});
