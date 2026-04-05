// src/components/references/ReferencePanel.tsx
import React from 'react';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { useUIStore } from '../../store/uiStore';

export function ReferencePanel() {
  const references = useDocumentStore((s) => s.references);
  const deleteReference = useDocumentStore((s) => s.deleteReference);
  const openModal = useUIStore((s) => s.openModal);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-xs text-zinc-400">{references.length} reference{references.length !== 1 ? 's' : ''}</span>
        <button
          type="button"
          onClick={() => openModal('addRef')}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {references.length === 0 && (
          <p className="text-xs text-zinc-600 px-2 py-3 text-center">No references yet</p>
        )}
        {references.map((ref, idx) => (
          <div
            key={ref.id}
            className="group flex items-start gap-2 p-2 rounded hover:bg-zinc-800 transition-colors"
          >
            <span className="text-xs font-mono text-zinc-600 shrink-0 pt-0.5 w-6 text-right">[{idx + 1}]</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-200 font-medium truncate">{ref.title || '(untitled)'}</p>
              <p className="text-xs text-zinc-500 truncate">{ref.authors}{ref.year ? `, ${ref.year}` : ''}</p>
              {ref.url && (
                <a href={ref.url} target="_blank" rel="noreferrer" className="text-xs text-accent flex items-center gap-0.5 mt-0.5 hover:underline">
                  <ExternalLink size={10} /> URL
                </a>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
              <button
                type="button"
                onClick={() => openModal('editRef', ref.id)}
                className="p-0.5 text-zinc-500 hover:text-zinc-200"
              ><Pencil size={11} /></button>
              <button
                type="button"
                onClick={() => deleteReference(ref.id)}
                className="p-0.5 text-zinc-500 hover:text-red-400"
              ><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
