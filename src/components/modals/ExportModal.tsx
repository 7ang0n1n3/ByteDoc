// src/components/modals/ExportModal.tsx
import React, { useState } from 'react';
import { Download, FileText, CheckCircle, AlertCircle, Palette } from 'lucide-react';
import { Modal } from './Modal';
import { useDocumentStore } from '../../store/documentStore';
import { useUIStore } from '../../store/uiStore';
import { useTemplateStore } from '../../store/templateStore';
import { exportToDocx } from '../../lib/export';

export function ExportModal() {
  const doc = useDocumentStore((s) => s.activeDocument);
  const sections = useDocumentStore((s) => s.sections);
  const changelog = useDocumentStore((s) => s.changelog);
  const references = useDocumentStore((s) => s.references);
  const figures = useDocumentStore((s) => s.figures);
  const tables = useDocumentStore((s) => s.tables);
  const closeModal = useUIStore((s) => s.closeModal);
  const openModal = useUIStore((s) => s.openModal);
  const { templates, activeTemplateId, setActiveTemplate, getActiveTemplate } = useTemplateStore();

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!doc) return null;

  const activeTemplate = getActiveTemplate();

  async function handleExport() {
    setStatus('loading');
    try {
      await exportToDocx(doc!, sections, changelog, references, activeTemplate ?? undefined);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  const sectionCount = sections.length;
  const wordCount = sections.reduce((sum, s) => {
    const text = JSON.stringify(s.content);
    return sum + text.split(/\s+/).length;
  }, 0);

  return (
    <Modal title="Export to DOCX" onClose={closeModal} size="sm">
      <div className="space-y-4">
        {/* Document summary */}
        <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-accent" />
            <span className="font-medium text-zinc-100">{doc.title}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>Author: <span className="text-zinc-300">{doc.author || '—'}</span></span>
            <span>Version: <span className="text-zinc-300">{doc.version}</span></span>
            <span>Status: <span className="text-zinc-300">{doc.status}</span></span>
            <span>Sections: <span className="text-zinc-300">{sectionCount}</span></span>
            <span>References: <span className="text-zinc-300">{references.length}</span></span>
            <span>Figures: <span className="text-zinc-300">{figures.length}</span></span>
            <span>Tables: <span className="text-zinc-300">{tables.length}</span></span>
            <span>Changelog: <span className="text-zinc-300">{changelog.length} entries</span></span>
          </div>
        </div>

        {/* Template selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Template</span>
            <button
              type="button"
              onClick={() => { closeModal(); openModal('templateSettings'); }}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-accent transition-colors"
            >
              <Palette size={11} />
              Manage
            </button>
          </div>
          <select
            className="text-sm bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 outline-none focus:border-accent w-full"
            value={activeTemplateId ?? ''}
            onChange={(e) => setActiveTemplate(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Export includes */}
        <div className="text-xs text-zinc-500 space-y-1">
          <p className="text-zinc-400 font-medium">Export will include:</p>
          <ul className="space-y-0.5 pl-3">
            {[
              'Title page',
              changelog.length > 0 && 'Changelog table',
              'Table of Contents',
              figures.length > 0 && 'List of Figures',
              tables.length > 0 && 'List of Tables',
              `${sectionCount} sections with auto-numbering`,
              references.length > 0 && `${references.length} references`,
              'Headers & footers',
            ].filter(Boolean).map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent/60 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Status */}
        {status === 'done' && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle size={15} />
            <span>Download started!</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-start gap-2 text-sm text-red-400">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>Export failed: {errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={closeModal} className="flex-1 text-sm py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600">
            {status === 'done' ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={status === 'loading'}
            className="flex-1 flex items-center justify-center gap-2 text-sm py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
          >
            <Download size={14} />
            {status === 'loading' ? 'Generating…' : 'Export DOCX'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
