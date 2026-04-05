// src/editor/Toolbar.tsx
import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link2, Link2Off,
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Minus, Table, Image, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Superscript, Subscript, Highlighter, Type,
  BookOpen, ImageIcon, TableIcon, SeparatorHorizontal,
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useUIStore } from '../store/uiStore';

interface ToolbarProps {
  editor: Editor | null;
}

const Divider = () => <span className="w-px h-5 bg-zinc-700 mx-1 self-center" />;

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
  const references = useDocumentStore((s) => s.references);
  const openModal = useUIStore((s) => s.openModal);

  if (!editor) return null;

  function applyLink() {
    if (linkUrl) {
      editor!.chain().focus().setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }

  function insertTable() {
    editor!.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
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

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-surface-850 border-b border-zinc-800 select-none">
      {/* Text style */}
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
      <ToolBtn onClick={insertTable} title="Insert Table">
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
  );
}
