// src/components/modals/DocumentSettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useDocumentStore } from '../../store/documentStore';
import { useUIStore } from '../../store/uiStore';

const statusOptions = ['Draft', 'Review', 'Final'] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'text-sm bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 outline-none focus:border-accent w-full';

export function DocumentSettingsModal() {
  const doc = useDocumentStore((s) => s.activeDocument);
  const updateMeta = useDocumentStore((s) => s.updateDocumentMeta);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);
  const closeModal = useUIStore((s) => s.closeModal);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    author: '',
    organization: '',
    version: '',
    status: 'Draft' as (typeof statusOptions)[number],
    description: '',
  });

  useEffect(() => {
    if (doc) {
      setForm({
        title: doc.title,
        subtitle: doc.subtitle,
        author: doc.author,
        organization: doc.organization,
        version: doc.version,
        status: doc.status,
        description: doc.description,
      });
    }
  }, [doc]);

  if (!doc) return null;

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    await updateMeta(form);
    closeModal();
  }

  async function handleDelete() {
    if (window.confirm(`Permanently delete "${doc!.title}"? This cannot be undone.`)) {
      await deleteDocument(doc!.id);
      closeModal();
    }
  }

  return (
    <Modal title="Document Settings" onClose={closeModal} size="md">
      <div className="space-y-3">
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Subtitle">
          <input className={inputClass} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Author">
            <input className={inputClass} value={form.author} onChange={(e) => set('author', e.target.value)} />
          </Field>
          <Field label="Organization">
            <input className={inputClass} value={form.organization} onChange={(e) => set('organization', e.target.value)} />
          </Field>
          <Field label="Version">
            <input className={inputClass} value={form.version} onChange={(e) => set('version', e.target.value)} placeholder="1.0" />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => set('status', e.target.value as typeof form.status)}
            >
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description / Abstract">
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-500 hover:text-red-400 transition-colors"
          >
            Delete document
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={closeModal} className="text-sm px-4 py-1.5 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="text-sm px-4 py-1.5 bg-accent text-white rounded hover:bg-accent-hover">
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
