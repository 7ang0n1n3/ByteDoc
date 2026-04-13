// src/components/sidebar/Sidebar.tsx
import React from 'react';
import { Plus, FileText, Settings, ChevronLeft } from 'lucide-react';
import { SectionTree } from './SectionTree';
import { useDocumentStore } from '../../store/documentStore';
import { useUIStore } from '../../store/uiStore';

export function Sidebar() {
  const activeDocument = useDocumentStore((s) => s.activeDocument);
  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const createDocument = useDocumentStore((s) => s.createDocument);
  const openDocument = useDocumentStore((s) => s.openDocument);
  const addSection = useDocumentStore((s) => s.addSection);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const openModal = useUIStore((s) => s.openModal);

  async function handleNewDocument() {
    await createDocument('Untitled Document');
  }

  async function handleAddTopSection() {
    await addSection('New Section', null);
  }

  async function handleDocDoubleClick(docId: string) {
    if (docId !== activeDocumentId) {
      await openDocument(docId);
    }
    openModal('docSettings');
  }

  return (
    <div className="flex flex-col h-full bg-surface-900 border-r border-zinc-800 w-64 shrink-0">
      {/* App header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-white text-xs font-bold">B</div>
          <span className="text-sm font-semibold text-zinc-100">ByteDoc</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
          title="Collapse sidebar"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* Document list */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Documents</span>
          <button
            type="button"
            onClick={handleNewDocument}
            className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded"
            title="New document"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {documents.length === 0 && (
            <p className="text-xs text-zinc-600 py-1">No documents yet</p>
          )}
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => openDocument(doc.id)}
              onDoubleClick={() => handleDocDoubleClick(doc.id)}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left text-sm transition-colors ${
                doc.id === activeDocumentId
                  ? 'bg-accent/20 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <FileText size={13} className="shrink-0" />
              <span className="truncate">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sections tree */}
      {activeDocument && (
        <>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sections</span>
            <button
              type="button"
              onClick={handleAddTopSection}
              className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded"
              title="Add top-level section"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <SectionTree />
          </div>
        </>
      )}

      {/* Bottom controls */}
      {activeDocument && (
        <div className="border-t border-zinc-800 px-3 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openModal('docSettings')}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Settings size={13} />
            Document Settings
          </button>
        </div>
      )}
    </div>
  );
}
