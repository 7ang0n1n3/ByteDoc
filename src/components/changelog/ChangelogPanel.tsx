// src/components/changelog/ChangelogPanel.tsx
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';

export function ChangelogPanel() {
  const changelog = useDocumentStore((s) => s.changelog);
  const activeDocument = useDocumentStore((s) => s.activeDocument);
  const addEntry = useDocumentStore((s) => s.addChangelogEntry);
  const deleteEntry = useDocumentStore((s) => s.deleteChangelogEntry);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ version: '', author: '', description: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addEntry({
      version: form.version,
      date: Date.now(),
      author: form.author || activeDocument?.author || '',
      description: form.description,
    });
    setForm({ version: '', author: '', description: '' });
    setAdding(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-xs text-zinc-400">{changelog.length} entr{changelog.length !== 1 ? 'ies' : 'y'}</span>
        <button
          type="button"
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {adding && (
        <form onSubmit={handleSubmit} className="p-3 border-b border-zinc-800 space-y-2">
          <input
            className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 outline-none focus:border-accent"
            placeholder="Version (e.g. 1.1)"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            required
          />
          <input
            className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 outline-none focus:border-accent"
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <textarea
            className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 outline-none focus:border-accent resize-none"
            placeholder="Description of changes…"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="text-xs px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover">Add</button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs px-3 py-1 bg-zinc-700 text-zinc-300 rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {changelog.length === 0 && (
          <p className="text-xs text-zinc-600 px-2 py-3 text-center">No changelog entries</p>
        )}
        {[...changelog].reverse().map((entry) => (
          <div key={entry.id} className="group flex items-start gap-2 p-2 rounded hover:bg-zinc-800">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-accent">{entry.version}</span>
                <span className="text-xs text-zinc-600">{new Date(entry.date).toLocaleDateString()}</span>
                <span className="text-xs text-zinc-500">{entry.author}</span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">{entry.description}</p>
            </div>
            <button
              type="button"
              onClick={() => deleteEntry(entry.id)}
              className="p-0.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 shrink-0"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
