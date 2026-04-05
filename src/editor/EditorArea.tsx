// src/editor/EditorArea.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { Bold, Italic, Underline, Link2, Link2Off } from 'lucide-react';
import { buildExtensions } from './extensions';
import { Toolbar } from './Toolbar';
import { useDocumentStore } from '../store/documentStore';
import type { JSONContent } from '@tiptap/core';

interface EditorAreaProps {
  sectionId: string;
}

function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    ((...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    }) as T,
    [delay]
  );
}

export function EditorArea({ sectionId }: EditorAreaProps) {
  const section = useDocumentStore((s) => s.sections.find((sec) => sec.id === sectionId));
  const updateTitle = useDocumentStore((s) => s.updateSectionTitle);
  const updateContent = useDocumentStore((s) => s.updateSectionContent);

  const saveContent = useDebouncedCallback(
    (id: string, content: JSONContent) => updateContent(id, content),
    600
  );

  const editor = useEditor({
    extensions: buildExtensions(),
    content: section?.content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px]',
        spellcheck: 'true',
      },
    },
    onUpdate({ editor }) {
      saveContent(sectionId, editor.getJSON());
    },
  });

  // Reload editor content when switching sections
  useEffect(() => {
    if (!editor || !section) return;
    const currentJSON = JSON.stringify(editor.getJSON());
    const sectionJSON = JSON.stringify(section.content);
    if (currentJSON !== sectionJSON) {
      editor.commands.setContent(section.content);
    }
  }, [sectionId]);

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Select a section to edit
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} />

      {/* Section title */}
      <div className="px-12 pt-8 pb-2">
        <input
          type="text"
          value={section.title}
          onChange={(e) => updateTitle(sectionId, e.target.value)}
          placeholder="Section title…"
          className="w-full bg-transparent text-2xl font-semibold text-zinc-100 border-none outline-none placeholder:text-zinc-600"
        />
      </div>

      {/* BubbleMenu */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-0.5 bg-surface-800 border border-zinc-700 rounded-lg shadow-xl px-1 py-1"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded ${editor.isActive('bold') ? 'bg-accent text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
            title="Bold"
          ><Bold size={13} /></button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded ${editor.isActive('italic') ? 'bg-accent text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
            title="Italic"
          ><Italic size={13} /></button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded ${editor.isActive('underline') ? 'bg-accent text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
            title="Underline"
          ><Underline size={13} /></button>
          {editor.isActive('link') ? (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1 rounded text-zinc-300 hover:bg-zinc-700"
              title="Remove link"
            ><Link2Off size={13} /></button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const url = prompt('URL:');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
              className="p-1 rounded text-zinc-300 hover:bg-zinc-700"
              title="Add link"
            ><Link2 size={13} /></button>
          )}
        </BubbleMenu>
      )}

      {/* Editor content area */}
      <div className="flex-1 overflow-y-auto px-12 py-6">
        <EditorContent editor={editor} />
      </div>

      {/* Word count */}
      {editor && (
        <div className="px-4 py-1.5 text-xs text-zinc-600 border-t border-zinc-800 flex justify-end">
          {editor.storage.characterCount?.words() ?? 0} words ·{' '}
          {editor.storage.characterCount?.characters() ?? 0} chars
        </div>
      )}
    </div>
  );
}
