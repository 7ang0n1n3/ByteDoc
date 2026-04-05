// src/components/modals/ReferenceModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useDocumentStore } from '../../store/documentStore';
import { useUIStore } from '../../store/uiStore';
import type { ReferenceType } from '../../types/reference';

const refTypes: ReferenceType[] = ['book', 'article', 'website', 'conference', 'other'];

const inputClass =
  'text-sm bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 outline-none focus:border-accent w-full';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const emptyForm = {
  type: 'article' as ReferenceType,
  authors: '',
  title: '',
  year: '',
  publisher: '',
  journal: '',
  volume: '',
  issue: '',
  pages: '',
  doi: '',
  url: '',
};

export function ReferenceModal() {
  const references = useDocumentStore((s) => s.references);
  const addReference = useDocumentStore((s) => s.addReference);
  const updateReference = useDocumentStore((s) => s.updateReference);
  const closeModal = useUIStore((s) => s.closeModal);
  const editingRefId = useUIStore((s) => s.editingRefId);
  const activeModal = useUIStore((s) => s.activeModal);

  const isEdit = activeModal === 'editRef' && !!editingRefId;
  const existingRef = isEdit ? references.find((r) => r.id === editingRefId) : null;

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (existingRef) {
      setForm({
        type: existingRef.type,
        authors: existingRef.authors,
        title: existingRef.title,
        year: existingRef.year,
        publisher: existingRef.publisher,
        journal: existingRef.journal,
        volume: existingRef.volume,
        issue: existingRef.issue,
        pages: existingRef.pages,
        doi: existingRef.doi,
        url: existingRef.url,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingRefId]);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit && editingRefId) {
      await updateReference(editingRefId, form);
    } else {
      await addReference(form);
    }
    closeModal();
  }

  return (
    <Modal title={isEdit ? 'Edit Reference' : 'Add Reference'} onClose={closeModal} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Type">
          <select className={inputClass} value={form.type} onChange={(e) => set('type', e.target.value)}>
            {refTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Authors">
          <input className={inputClass} placeholder="Smith, J. and Doe, A." value={form.authors} onChange={(e) => set('authors', e.target.value)} required />
        </Field>
        <Field label="Title">
          <input className={inputClass} placeholder="Title of work" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <input className={inputClass} placeholder="2024" value={form.year} onChange={(e) => set('year', e.target.value)} />
          </Field>
          {form.type === 'book' && (
            <Field label="Publisher">
              <input className={inputClass} placeholder="Publisher" value={form.publisher} onChange={(e) => set('publisher', e.target.value)} />
            </Field>
          )}
          {(form.type === 'article' || form.type === 'conference') && (
            <>
              <Field label="Journal / Conference">
                <input className={inputClass} value={form.journal} onChange={(e) => set('journal', e.target.value)} />
              </Field>
              <Field label="Volume">
                <input className={inputClass} value={form.volume} onChange={(e) => set('volume', e.target.value)} />
              </Field>
              <Field label="Issue">
                <input className={inputClass} value={form.issue} onChange={(e) => set('issue', e.target.value)} />
              </Field>
              <Field label="Pages">
                <input className={inputClass} placeholder="1–10" value={form.pages} onChange={(e) => set('pages', e.target.value)} />
              </Field>
            </>
          )}
        </div>
        {form.type === 'article' && (
          <Field label="DOI">
            <input className={inputClass} placeholder="10.1000/xyz123" value={form.doi} onChange={(e) => set('doi', e.target.value)} />
          </Field>
        )}
        {form.type === 'website' && (
          <Field label="URL">
            <input className={inputClass} placeholder="https://…" value={form.url} onChange={(e) => set('url', e.target.value)} />
          </Field>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
          <button type="button" onClick={closeModal} className="text-sm px-4 py-1.5 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600">
            Cancel
          </button>
          <button type="submit" className="text-sm px-4 py-1.5 bg-accent text-white rounded hover:bg-accent-hover">
            {isEdit ? 'Save' : 'Add Reference'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
