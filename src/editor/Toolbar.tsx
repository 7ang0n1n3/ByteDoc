// src/editor/Toolbar.tsx
import React, { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, BookOpen, CheckSquare, ChevronDown,
  Code, Columns3, Download, Heading1, Heading2, Heading3, Highlighter, Image,
  ImageIcon, IndentDecrease, IndentIncrease, Italic, Link2, Link2Off, List, ListOrdered,
  Minus, PaintBucket, Palette, Plus, Quote, Redo2, Rows3, Save, SeparatorHorizontal,
  Strikethrough, Subscript, Superscript, Table, TableIcon, Trash2, Type, Underline, Undo2,
  Bold, SquareDashedBottom,
} from 'lucide-react';
import { Modal } from '../components/modals/Modal';
import { useDocumentStore } from '../store/documentStore';
import { useUIStore } from '../store/uiStore';

interface ToolbarProps {
  editor: Editor | null;
}

type MenuName = 'file' | 'edit' | 'insert' | 'format' | 'table' | 'tools' | 'view';
type PopoverName = 'style' | 'textColor' | 'highlight' | 'align' | 'lists' | 'tableGrid' | null;

const FONT_SIZES = ['', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt', '32pt'];
const BORDER_STYLES = ['', 'solid', 'dashed', 'dotted', 'double', 'none'];
const COLOR_SWATCHES = ['#111827', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#f8fafc'];
const HIGHLIGHT_SWATCHES = ['#fef08a', '#fed7aa', '#fecaca', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fbcfe8', '#e4e4e7'];

function colorInputValue(value: string | null | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback;
}

function toolbarButtonClass(active?: boolean) {
  return `h-8 min-w-8 inline-flex items-center justify-center gap-1 rounded px-2 text-xs transition-colors ${
    active
      ? 'bg-accent text-white'
      : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
  }`;
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
      className={`${toolbarButtonClass(active)} disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-6 bg-zinc-700 mx-1 self-center" />;
}

function Popover({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`absolute left-0 top-full z-30 mt-1 rounded border border-zinc-700 bg-surface-900 p-2 shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function MenuButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 rounded px-2 text-xs font-medium transition-colors ${
        active
          ? 'bg-zinc-800 text-zinc-100'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
      }`}
    >
      {label}
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
  const [activeMenu, setActiveMenu] = useState<MenuName | null>(null);
  const [activePopover, setActivePopover] = useState<PopoverName>(null);
  const [gridHover, setGridHover] = useState({ rows: 0, cols: 0 });
  const [, setEditorTick] = useState(0);
  const activeSectionId = useDocumentStore((s) => s.activeSectionId);
  const updateContent = useDocumentStore((s) => s.updateSectionContent);
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

  function saveNow() {
    if (activeSectionId) updateContent(activeSectionId, editor!.getJSON());
  }

  function applyLink() {
    if (linkUrl) editor!.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkInput(false);
    setLinkUrl('');
  }

  function openTableDialog() {
    setTableRows(3);
    setTableCols(3);
    setTableHasHeader(false);
    setShowTableDialog(true);
    setActivePopover(null);
  }

  function insertTable(rows = tableRows, cols = tableCols, withHeaderRow = tableHasHeader) {
    editor!.chain().focus().insertTable({
      rows: Math.min(20, Math.max(1, rows)),
      cols: Math.min(12, Math.max(1, cols)),
      withHeaderRow,
    }).run();
    setShowTableDialog(false);
    setActivePopover(null);
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
    if (fontSize) editor!.chain().focus().setFontSize(fontSize).run();
    else editor!.chain().focus().unsetFontSize().run();
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

  function setStyle(style: string) {
    const chain = editor!.chain().focus();
    switch (style) {
      case 'paragraph':
        chain.setParagraph().run();
        break;
      case 'heading1':
        chain.toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        chain.toggleHeading({ level: 2 }).run();
        break;
      case 'heading3':
        chain.toggleHeading({ level: 3 }).run();
        break;
      case 'heading4':
        chain.toggleHeading({ level: 4 }).run();
        break;
      case 'heading5':
        chain.toggleHeading({ level: 5 }).run();
        break;
      case 'heading6':
        chain.toggleHeading({ level: 6 }).run();
        break;
      case 'quote':
        chain.toggleBlockquote().run();
        break;
      case 'codeBlock':
        chain.toggleCodeBlock().run();
        break;
    }
    setActivePopover(null);
  }

  function currentStyleLabel() {
    if (editor!.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor!.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor!.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor!.isActive('heading', { level: 4 })) return 'Heading 4';
    if (editor!.isActive('heading', { level: 5 })) return 'Heading 5';
    if (editor!.isActive('heading', { level: 6 })) return 'Heading 6';
    if (editor!.isActive('blockquote')) return 'Quote';
    if (editor!.isActive('codeBlock')) return 'Code Block';
    return 'Paragraph';
  }

  function togglePopover(name: Exclude<PopoverName, null>) {
    setActiveMenu(null);
    setActivePopover((current) => current === name ? null : name);
  }

  function toggleMenu(name: MenuName) {
    setActivePopover(null);
    setActiveMenu((current) => current === name ? null : name);
  }

  const currentFontSize = editor.getAttributes('textStyle').fontSize ?? '';
  const isInTable = editor.isActive('table');
  const activeCellAttrs = editor.getAttributes(editor.isActive('tableHeader') ? 'tableHeader' : 'tableCell');
  const cellBackgroundColor = colorInputValue(activeCellAttrs.backgroundColor, '#18181b');
  const cellTextColor = colorInputValue(activeCellAttrs.textColor, '#d4d4d8');
  const cellBorderStyle = activeCellAttrs.borderStyle ?? '';

  const menuItems: Record<MenuName, { label: string; action: () => void }[]> = {
    file: [
      { label: 'Save', action: saveNow },
      { label: 'Export DOCX', action: () => openModal('export') },
    ],
    edit: [
      { label: 'Undo', action: () => editor.chain().focus().undo().run() },
      { label: 'Redo', action: () => editor.chain().focus().redo().run() },
    ],
    insert: [
      { label: 'Link', action: () => setShowLinkInput(true) },
      { label: 'Image', action: insertImage },
      { label: 'Table', action: openTableDialog },
      { label: 'Page break', action: () => editor.chain().focus().insertPageBreak().run() },
      { label: 'Citation', action: insertCitation },
      { label: 'Footnote', action: insertFootnote },
      { label: 'Figure caption', action: insertFigureCaption },
      { label: 'Table caption', action: insertTableCaption },
    ],
    format: [
      { label: 'Paragraph', action: () => setStyle('paragraph') },
      { label: 'Heading 1', action: () => setStyle('heading1') },
      { label: 'Heading 2', action: () => setStyle('heading2') },
      { label: 'Quote', action: () => setStyle('quote') },
      { label: 'Code block', action: () => setStyle('codeBlock') },
    ],
    table: [
      { label: 'Insert table', action: openTableDialog },
      { label: 'Toggle header row', action: () => editor.chain().focus().toggleHeaderRow().run() },
      { label: 'Toggle header column', action: () => editor.chain().focus().toggleHeaderColumn().run() },
      { label: 'Delete table', action: () => editor.chain().focus().deleteTable().run() },
    ],
    tools: [
      { label: 'Templates', action: () => openModal('templateSettings') },
      { label: 'Document settings', action: () => openModal('docSettings') },
    ],
    view: [
      { label: 'Contents panel', action: () => undefined },
    ],
  };

  return (
    <>
      <div className="sticky top-0 z-20 shrink-0 border-b border-zinc-800 bg-surface-850 text-zinc-100">
        <div className="flex h-9 items-center justify-between gap-3 px-3 border-b border-zinc-800">
          <div className="flex items-center gap-0.5">
            {(Object.keys(menuItems) as MenuName[]).map((name) => (
              <div key={name} className="relative">
                <MenuButton
                  label={name[0].toUpperCase() + name.slice(1)}
                  active={activeMenu === name}
                  onClick={() => toggleMenu(name)}
                />
                {activeMenu === name && (
                  <Popover className="min-w-44">
                    <div className="space-y-1">
                      {menuItems[name].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            item.action();
                            setActiveMenu(null);
                          }}
                          className="block w-full rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </Popover>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <ToolBtn onClick={saveNow} title="Save">
              <Save size={15} />
              <span>Save</span>
            </ToolBtn>
            <ToolBtn onClick={() => openModal('export')} title="Export DOCX">
              <Download size={15} />
              <span>Export</span>
            </ToolBtn>
          </div>
        </div>

        <div className="flex min-h-11 flex-wrap items-center gap-1 px-3 py-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopover('style')}
              className="h-8 min-w-32 inline-flex items-center justify-between gap-2 rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-100 hover:bg-zinc-700"
              title="Style"
            >
              <span>{currentStyleLabel()}</span>
              <ChevronDown size={13} />
            </button>
            {activePopover === 'style' && (
              <Popover className="min-w-40">
                {[
                  ['paragraph', 'Paragraph'],
                  ['heading1', 'Heading 1'],
                  ['heading2', 'Heading 2'],
                  ['heading3', 'Heading 3'],
                  ['heading4', 'Heading 4'],
                  ['heading5', 'Heading 5'],
                  ['heading6', 'Heading 6'],
                  ['quote', 'Quote'],
                  ['codeBlock', 'Code Block'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStyle(value)}
                    className="block w-full rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    {label}
                  </button>
                ))}
              </Popover>
            )}
          </div>

          <select
            aria-label="Font size"
            title="Font size"
            value={currentFontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="h-8 w-20 rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-100 outline-none focus:border-accent"
          >
            <option value="">Size</option>
            {FONT_SIZES.filter(Boolean).map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <Divider />

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
          <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
            <Superscript size={15} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
            <Subscript size={15} />
          </ToolBtn>

          <Divider />

          <div className="relative">
            <ToolBtn onClick={() => togglePopover('textColor')} title="Text Color">
              <Palette size={15} />
              <ChevronDown size={12} />
            </ToolBtn>
            {activePopover === 'textColor' && (
              <Popover className="grid grid-cols-5 gap-1">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setActivePopover(null);
                    }}
                    className="h-6 w-6 rounded border border-zinc-700"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </Popover>
            )}
          </div>
          <div className="relative">
            <ToolBtn onClick={() => togglePopover('highlight')} active={editor.isActive('highlight')} title="Highlight">
              <Highlighter size={15} />
              <ChevronDown size={12} />
            </ToolBtn>
            {activePopover === 'highlight' && (
              <Popover className="grid grid-cols-4 gap-1">
                {HIGHLIGHT_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setActivePopover(null);
                    }}
                    className="h-6 w-6 rounded border border-zinc-700"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </Popover>
            )}
          </div>

          <Divider />

          <div className="relative">
            <ToolBtn onClick={() => togglePopover('align')} title="Alignment">
              <AlignLeft size={15} />
              <ChevronDown size={12} />
            </ToolBtn>
            {activePopover === 'align' && (
              <Popover className="flex gap-1">
                <ToolBtn onClick={() => { editor.chain().focus().setTextAlign('left').run(); setActivePopover(null); }} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={15} /></ToolBtn>
                <ToolBtn onClick={() => { editor.chain().focus().setTextAlign('center').run(); setActivePopover(null); }} active={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenter size={15} /></ToolBtn>
                <ToolBtn onClick={() => { editor.chain().focus().setTextAlign('right').run(); setActivePopover(null); }} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={15} /></ToolBtn>
                <ToolBtn onClick={() => { editor.chain().focus().setTextAlign('justify').run(); setActivePopover(null); }} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={15} /></ToolBtn>
              </Popover>
            )}
          </div>
          <ToolBtn onClick={() => editor.chain().focus().decreaseIndent().run()} title="Decrease Indent">
            <IndentDecrease size={15} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().increaseIndent().run()} title="Increase Indent">
            <IndentIncrease size={15} />
          </ToolBtn>

          <Divider />

          <div className="relative">
            <ToolBtn onClick={() => togglePopover('lists')} title="Lists">
              <List size={15} />
              <ChevronDown size={12} />
            </ToolBtn>
            {activePopover === 'lists' && (
              <Popover className="flex gap-1">
                <ToolBtn onClick={() => { editor.chain().focus().toggleBulletList().run(); setActivePopover(null); }} active={editor.isActive('bulletList')} title="Bullet List"><List size={15} /></ToolBtn>
                <ToolBtn onClick={() => { editor.chain().focus().toggleOrderedList().run(); setActivePopover(null); }} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={15} /></ToolBtn>
                <ToolBtn onClick={() => { editor.chain().focus().toggleTaskList().run(); setActivePopover(null); }} active={editor.isActive('taskList')} title="Task List"><CheckSquare size={15} /></ToolBtn>
              </Popover>
            )}
          </div>

          <Divider />

          {showLinkInput ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                className="h-8 w-48 rounded border border-zinc-700 bg-zinc-800 px-2 text-sm text-zinc-100 outline-none focus:border-accent"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
              />
              <button type="button" onClick={applyLink} className="h-8 rounded bg-accent px-2 text-xs text-white">OK</button>
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
          <ToolBtn onClick={insertImage} title="Insert Image">
            <Image size={15} />
          </ToolBtn>
          <div className="relative">
            <ToolBtn onClick={() => togglePopover('tableGrid')} title="Insert Table">
              <Table size={15} />
              <ChevronDown size={12} />
            </ToolBtn>
            {activePopover === 'tableGrid' && (
              <Popover className="w-48">
                <div className="mb-2 text-xs text-zinc-500">
                  {gridHover.rows && gridHover.cols ? `${gridHover.rows} x ${gridHover.cols}` : 'Select table size'}
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {Array.from({ length: 36 }, (_, index) => {
                    const row = Math.floor(index / 6) + 1;
                    const col = (index % 6) + 1;
                    const active = row <= gridHover.rows && col <= gridHover.cols;
                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        onMouseEnter={() => setGridHover({ rows: row, cols: col })}
                        onClick={() => insertTable(row, col, false)}
                        className={`h-5 rounded border ${
                          active
                            ? 'border-accent bg-accent/30'
                            : 'border-zinc-700 bg-zinc-800'
                        }`}
                        title={`${row} x ${col}`}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={openTableDialog}
                  className="mt-2 w-full rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Custom table...
                </button>
              </Popover>
            )}
          </div>
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
            <Code size={15} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} title="Undo">
            <Undo2 size={15} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} title="Redo">
            <Redo2 size={15} />
          </ToolBtn>

          {isInTable && (
            <>
              <Divider />
              <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before"><Rows3 size={15} /><Plus size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After"><Rows3 size={15} /><Plus size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row"><Rows3 size={15} /><Trash2 size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before"><Columns3 size={15} /><Plus size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After"><Columns3 size={15} /><Plus size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column"><Columns3 size={15} /><Trash2 size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table"><Table size={15} /><Trash2 size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="Toggle Header Row"><Rows3 size={15} /><Heading1 size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleHeaderColumn().run()} title="Toggle Header Column"><Columns3 size={15} /><Heading1 size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleHeaderCell().run()} active={editor.isActive('tableHeader')} title="Toggle Header Cell"><TableIcon size={15} /><Heading1 size={10} className="-mt-3 -ml-1" /></ToolBtn>
              <label className={toolbarButtonClass()} title="Cell background color">
                <PaintBucket size={15} />
                <input type="color" value={cellBackgroundColor} onChange={(e) => setCellAttribute('backgroundColor', e.target.value)} className="h-5 w-6 cursor-pointer bg-transparent" aria-label="Cell background color" />
              </label>
              <label className={toolbarButtonClass()} title="Cell foreground color">
                <Palette size={15} />
                <input type="color" value={cellTextColor} onChange={(e) => setCellAttribute('textColor', e.target.value)} className="h-5 w-6 cursor-pointer bg-transparent" aria-label="Cell foreground color" />
              </label>
              <label className="inline-flex h-8 items-center gap-1 rounded px-2 text-xs text-zinc-500" title="Cell line type">
                <SquareDashedBottom size={15} />
                <select aria-label="Cell line type" value={cellBorderStyle} onChange={(e) => setCellAttribute('borderStyle', e.target.value)} className="h-7 w-20 rounded border border-zinc-700 bg-zinc-800 px-1 text-xs text-zinc-100 outline-none focus:border-accent">
                  <option value="">Line</option>
                  {BORDER_STYLES.filter(Boolean).map((style) => <option key={style} value={style}>{style}</option>)}
                </select>
              </label>
              <ToolBtn onClick={clearCellStyle} title="Clear Cell Style"><Palette size={15} /><Trash2 size={10} className="-mt-3 -ml-1" /></ToolBtn>
            </>
          )}

          <Divider />
          <ToolBtn onClick={insertCitation} title="Insert Citation [n]"><BookOpen size={15} /></ToolBtn>
          <ToolBtn onClick={insertFootnote} title="Insert Footnote"><Type size={15} /></ToolBtn>
          <ToolBtn onClick={insertFigureCaption} title="Insert Figure Caption"><ImageIcon size={15} /></ToolBtn>
          <ToolBtn onClick={insertTableCaption} title="Insert Table Caption"><TableIcon size={15} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={15} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().insertPageBreak().run()} title="Page Break"><SeparatorHorizontal size={15} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={15} /></ToolBtn>
        </div>
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
