// src/editor/Toolbar.tsx
import React, { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link2, Link2Off,
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Minus, Table, Image, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Superscript, Subscript, Highlighter, Type, IndentDecrease, IndentIncrease,
  BookOpen, ImageIcon, TableIcon, SeparatorHorizontal,
  Columns3, Rows3, PaintBucket, Palette, Plus, Trash2, SquareDashedBottom,
} from 'lucide-react';
import { Modal } from '../components/modals/Modal';
import { useDocumentStore } from '../store/documentStore';
import { useUIStore } from '../store/uiStore';

interface ToolbarProps {
  editor: Editor | null;
}

const Divider = () => <span className="w-px h-5 bg-zinc-700 mx-1 self-center" />;
const FONT_SIZES = ['', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt', '32pt'];
const BORDER_STYLES = ['', 'solid', 'dashed', 'dotted', 'double', 'none'];

function colorInputValue(value: string | null | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback;
}

function ToolBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-accent text-white'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function Toolbar({ editor }: ToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(false);
  const [, setEditorTick] = useState(0);
  const references = useDocumentStore((s) => s.references);
  const openModal = useUIStore((s) => s.openModal);

  useEffect(() => {
    if (!editor) return;

    const update = () => setEditorTick((tick) => tick + 1);
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!editor) return null;

  function applyLink() {
    if (linkUrl) {
      editor!.chain().focus().setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }

  function openTableDialog() {
    setTableRows(3);
    setTableCols(3);
    setTableHasHeader(false);
    setShowTableDialog(true);
  }

  function insertTable() {
    editor!.chain().focus().insertTable({
      rows: Math.min(20, Math.max(1, tableRows)),
      cols: Math.min(12, Math.max(1, tableCols)),
      withHeaderRow: tableHasHeader,
    }).run();
    setShowTableDialog(false);
  }

  function insertImage() {
    const url = prompt('Image URL or paste base64:');
    if (url) editor!.chain().focus().setImage({ src: url }).run();
  }

  function insertFigureCaption() {
    editor!.chain().focus().insertContent({ type: 'figureCaption', content: [{ type: 'text', text: 'Caption text' }] }).run();
  }

  function insertTableCaption() {
    editor!.chain().focus().insertContent({ type: 'tableCaption', content: [{ type: 'text', text: 'Caption text' }] }).run();
  }

  function insertFootnote() {
    const content = prompt('Footnote text:');
    if (content) {
      editor!.chain().focus().insertContent({
        type: 'footnote',
        attrs: { content, number: null },
      }).run();
    }
  }

  function insertCitation() {
    openModal('addRef');
  }

  function setFontSize(fontSize: string) {
    if (fontSize) {
      editor!.chain().focus().setFontSize(fontSize).run();
    } else {
      editor!.chain().focus().unsetFontSize().run();
    }
  }

  function setCellAttribute(name: string, value: string | null) {
    editor!.chain().focus().setCellAttribute(name, value || null).run();
  }

  function clearCellStyle() {
    editor!.chain().focus()
      .setCellAttribute('backgroundColor', null)
      .setCellAttribute('textColor', null)
      .setCellAttribute('borderStyle', null)
      .run();
  }

  const currentFontSize = editor.getAttributes('textStyle').fontSize ?? '';
  const isInTable = editor.isActive('table');
  const activeCellAttrs = editor.getAttributes(editor.isActive('tableHeader') ? 'tableHeader' : 'tableCell');
  const cellBackgroundColor = colorInputValue(activeCellAttrs.backgroundColor, '#18181b');
  const cellTextColor = colorInputValue(activeCellAttrs.textColor, '#d4d4d8');
  const cellBorderStyle = activeCellAttrs.borderStyle ?? '';

  return (
    <>
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-surface-850 border-b border-zinc-800 select-none">
      {/* Text style */}
      <select
        aria-label="Font size"
        title="Font size"
        value={currentFontSize}
        onChange={(e) => setFontSize(e.target.value)}
        className="h-7 w-20 rounded bg-zinc-800 border border-zinc-700 px-2 text-xs text-zinc-200 outline-none focus:border-accent"
      >
        <option value="">Size</option>
        {FONT_SIZES.filter(Boolean).map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <Underline size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
        <Code size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
        <Superscript size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
        <Subscript size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <Highlighter size={15} />
      </ToolBtn>

      <Divider />

      {/* Headings */}
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 size={15} />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
        <ListOrdered size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task List">
        <CheckSquare size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <Quote size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <Minus size={15} />
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
        <AlignCenter size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().decreaseIndent().run()} title="Decrease Indent">
        <IndentDecrease size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().increaseIndent().run()} title="Increase Indent">
        <IndentIncrease size={15} />
      </ToolBtn>

      <Divider />

      {/* Link */}
      {showLinkInput ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            className="text-sm bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-zinc-100 w-48 outline-none focus:border-accent"
            placeholder="https://…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
          />
          <button type="button" onClick={applyLink} className="text-xs px-2 py-1 bg-accent text-white rounded">OK</button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 rounded">✕</button>
        </div>
      ) : (
        <>
          <ToolBtn onClick={() => setShowLinkInput(true)} active={editor.isActive('link')} title="Insert Link">
            <Link2 size={15} />
          </ToolBtn>
          {editor.isActive('link') && (
            <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
              <Link2Off size={15} />
            </ToolBtn>
          )}
        </>
      )}

      <Divider />

      {/* Insert */}
      <ToolBtn onClick={openTableDialog} title="Insert Table">
        <Table size={15} />
      </ToolBtn>
      <ToolBtn onClick={insertImage} title="Insert Image">
        <Image size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
        <Code size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().insertPageBreak().run()} title="Page Break">
        <SeparatorHorizontal size={15} />
      </ToolBtn>

      {isInTable && (
        <>
          <Divider />

          {/* Table editing */}
          <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before">
            <Rows3 size={15} />
            <Plus size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After">
            <Rows3 size={15} />
            <Plus size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">
            <Rows3 size={15} />
            <Trash2 size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before">
            <Columns3 size={15} />
            <Plus size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After">
            <Columns3 size={15} />
            <Plus size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">
            <Columns3 size={15} />
            <Trash2 size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
            <Table size={15} />
            <Trash2 size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="Toggle Header Row">
            <Rows3 size={15} />
            <Heading1 size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeaderColumn().run()} title="Toggle Header Column">
            <Columns3 size={15} />
            <Heading1 size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeaderCell().run()} active={editor.isActive('tableHeader')} title="Toggle Header Cell">
            <TableIcon size={15} />
            <Heading1 size={10} className="-mt-3 -ml-1" />
          </ToolBtn>

          <label className="flex items-center gap-1 h-7 px-1 rounded text-zinc-400 hover:bg-zinc-700" title="Cell background color">
            <PaintBucket size={15} />
            <input
              type="color"
              value={cellBackgroundColor}
              onChange={(e) => setCellAttribute('backgroundColor', e.target.value)}
              className="h-5 w-6 cursor-pointer bg-transparent"
              aria-label="Cell background color"
            />
          </label>
          <label className="flex items-center gap-1 h-7 px-1 rounded text-zinc-400 hover:bg-zinc-700" title="Cell foreground color">
            <Palette size={15} />
            <input
              type="color"
              value={cellTextColor}
              onChange={(e) => setCellAttribute('textColor', e.target.value)}
              className="h-5 w-6 cursor-pointer bg-transparent"
              aria-label="Cell foreground color"
            />
          </label>
          <label className="flex items-center gap-1 h-7 px-1 rounded text-zinc-400" title="Cell line type">
            <SquareDashedBottom size={15} />
            <select
              aria-label="Cell line type"
              value={cellBorderStyle}
              onChange={(e) => setCellAttribute('borderStyle', e.target.value)}
              className="h-7 w-20 rounded bg-zinc-800 border border-zinc-700 px-1 text-xs text-zinc-200 outline-none focus:border-accent"
            >
              <option value="">Line</option>
              {BORDER_STYLES.filter(Boolean).map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </label>
          <ToolBtn onClick={clearCellStyle} title="Clear Cell Style">
            <Palette size={15} />
            <Trash2 size={10} className="-mt-3 -ml-1" />
          </ToolBtn>
        </>
      )}

      <Divider />

      {/* Academic inserts */}
      <ToolBtn onClick={insertCitation} title="Insert Citation [n]">
        <BookOpen size={15} />
      </ToolBtn>
      <ToolBtn onClick={insertFootnote} title="Insert Footnote">
        <Type size={15} />
      </ToolBtn>
      <ToolBtn onClick={insertFigureCaption} title="Insert Figure Caption">
        <ImageIcon size={15} />
      </ToolBtn>
      <ToolBtn onClick={insertTableCaption} title="Insert Table Caption">
        <TableIcon size={15} />
      </ToolBtn>
    </div>
    {showTableDialog && (
      <Modal title="Insert Table" onClose={() => setShowTableDialog(false)} size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            insertTable();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-zinc-400 mb-1">Rows</span>
              <input
                type="number"
                min={1}
                max={20}
                value={tableRows}
                onChange={(e) => setTableRows(Number.parseInt(e.target.value, 10) || 1)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-zinc-400 mb-1">Columns</span>
              <input
                type="number"
                min={1}
                max={12}
                value={tableCols}
                onChange={(e) => setTableCols(Number.parseInt(e.target.value, 10) || 1)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={tableHasHeader}
              onChange={(e) => setTableHasHeader(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            First row is a header
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowTableDialog(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-accent text-sm font-medium text-white hover:bg-accent-hover"
            >
              Insert
            </button>
          </div>
        </form>
      </Modal>
    )}
    </>
  );
}
