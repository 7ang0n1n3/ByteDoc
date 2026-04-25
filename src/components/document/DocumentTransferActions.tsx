import React, { useRef } from 'react';
import type { JSONContent } from '@tiptap/core';
import { Download, Save, Upload } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useDocumentStore } from '../../store/documentStore';
import { useUIStore } from '../../store/uiStore';

function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'bytedoc-document';
}

function transferButtonClass(compact: boolean) {
  const size = compact ? 'h-8 min-w-8 px-2' : 'h-9 px-3';
  return `${size} inline-flex items-center justify-center gap-1.5 rounded text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40`;
}

interface DocumentTransferActionsProps {
  currentSectionContent?: () => JSONContent;
  compact?: boolean;
  actions?: DocumentTransferController;
}

export interface DocumentTransferController {
  canExport: boolean;
  fileInput: React.ReactNode;
  exportJson: () => Promise<void>;
  importJson: () => void;
  exportDocx: () => void;
}

export function useDocumentTransferActions(currentSectionContent?: () => JSONContent): DocumentTransferController {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeDocument = useDocumentStore((s) => s.activeDocument);
  const exportActiveDocumentJson = useDocumentStore((s) => s.exportActiveDocumentJson);
  const importDocumentJson = useDocumentStore((s) => s.importDocumentJson);
  const openModal = useUIStore((s) => s.openModal);

  async function exportJson() {
    const backup = await exportActiveDocumentJson(currentSectionContent?.());
    if (!backup) return;

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${safeFilename(backup.document.title)}.bytedoc.json`);
  }

  async function importJsonFile(file: File) {
    try {
      const text = await file.text();
      await importDocumentJson(JSON.parse(text));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to load ByteDoc JSON file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return {
    canExport: Boolean(activeDocument),
    fileInput: (
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json,.bytedoc.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importJsonFile(file);
        }}
      />
    ),
    exportJson,
    importJson: () => fileInputRef.current?.click(),
    exportDocx: () => openModal('export'),
  };
}

export function DocumentTransferActions({ currentSectionContent, compact = false, actions }: DocumentTransferActionsProps) {
  const ownActions = useDocumentTransferActions(currentSectionContent);
  const controls = actions ?? ownActions;
  const buttonClass = transferButtonClass(compact);

  return (
    <div className="flex items-center gap-1">
      {controls.fileInput}
      <button
        type="button"
        onClick={controls.exportJson}
        disabled={!controls.canExport}
        title={controls.canExport ? 'Export JSON' : 'Create or import a document before exporting JSON'}
        className={`${buttonClass} text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100`}
      >
        <Save size={15} />
        <span>{compact ? 'Save' : 'Export JSON'}</span>
      </button>
      <button
        type="button"
        onClick={controls.importJson}
        title="Import JSON"
        className={`${buttonClass} text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100`}
      >
        <Upload size={15} />
        <span>{compact ? 'Load' : 'Import JSON'}</span>
      </button>
      <button
        type="button"
        onClick={controls.exportDocx}
        disabled={!controls.canExport}
        title={controls.canExport ? 'Export DOCX' : 'Create or import a document before exporting DOCX'}
        className={`${buttonClass} text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100`}
      >
        <Download size={15} />
        <span>{compact ? 'Export' : 'Export DOCX'}</span>
      </button>
    </div>
  );
}
