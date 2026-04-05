// src/editor/extensions/index.ts
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';

import { CitationNode } from './Citation';
import { FootnoteNode } from './Footnote';
import { FigureCaptionNode } from './FigureCaption';
import { TableCaptionNode } from './TableCaption';
import { PageBreakNode } from './PageBreak';

const lowlight = createLowlight(common);

export function buildExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false, // replaced by CodeBlockLowlight
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Superscript,
    Subscript,
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    Image.configure({ inline: false, allowBase64: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Typography,
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') return 'Section heading…';
        return 'Start writing…';
      },
    }),
    CharacterCount,
    CodeBlockLowlight.configure({ lowlight }),
    CitationNode,
    FootnoteNode,
    FigureCaptionNode,
    TableCaptionNode,
    PageBreakNode,
  ];
}
