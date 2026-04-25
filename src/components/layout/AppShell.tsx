// src/components/layout/AppShell.tsx
import React, { useEffect } from 'react';
import {
  PanelLeft, List, BookOpen, Clock, ImageIcon, Menu, Sun, Moon,
} from 'lucide-react';
import { Sidebar } from '../sidebar/Sidebar';
import { EditorArea } from '../../editor/EditorArea';
import { TableOfContents } from '../toc/TableOfContents';
import { ReferencePanel } from '../references/ReferencePanel';
import { ChangelogPanel } from '../changelog/ChangelogPanel';
import { FiguresPanel } from '../figures/FiguresPanel';
import { DocumentSettingsModal } from '../modals/DocumentSettingsModal';
import { ExportModal } from '../modals/ExportModal';
import { ReferenceModal } from '../modals/ReferenceModal';
import { TemplateSettingsModal } from '../modals/TemplateSettingsModal';
import { useDocumentStore } from '../../store/documentStore';
import { useUIStore } from '../../store/uiStore';
import { useTemplateStore } from '../../store/templateStore';

const PANELS = [
  { id: 'toc',        label: 'Contents',   Icon: List      },
  { id: 'references', label: 'References', Icon: BookOpen  },
  { id: 'changelog',  label: 'Changelog',  Icon: Clock     },
  { id: 'figures',    label: 'Figures',    Icon: ImageIcon },
] as const;

export function AppShell() {
  const activeDocument = useDocumentStore((s) => s.activeDocument);
  const activeSectionId = useDocumentStore((s) => s.activeSectionId);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const activePanel = useUIStore((s) => s.activePanel);
  const activeModal = useUIStore((s) => s.activeModal);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const loadTemplates = useTemplateStore((s) => s.loadTemplates);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-950">
      {/* Sidebar */}
      {sidebarOpen ? (
        <Sidebar />
      ) : (
        <div className="flex flex-col items-center py-3 px-1 bg-surface-900 border-r border-zinc-800 gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-zinc-500 hover:text-zinc-200 rounded"
            title="Open sidebar"
          >
            <Menu size={16} />
          </button>
        </div>
      )}

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar bar with document controls */}
        {activeDocument && (
          <div className="flex items-center justify-between px-4 py-2 bg-surface-900 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded shrink-0"
                >
                  <PanelLeft size={15} />
                </button>
              )}
              <h1 className="text-sm font-semibold text-zinc-100 truncate">{activeDocument.title}</h1>
              <span className="text-xs text-zinc-600 shrink-0">v{activeDocument.version} · {activeDocument.status}</span>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {!activeDocument ? (
            <WelcomeScreen />
          ) : activeSectionId ? (
            <EditorArea key={activeSectionId} sectionId={activeSectionId} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <p className="text-zinc-500 text-sm">No section selected</p>
                <p className="text-zinc-600 text-xs">Create a section in the sidebar to begin writing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      {activeDocument && (
        <div className="flex h-full border-l border-zinc-800">
          {/* Panel tab icons */}
          <div className="flex flex-col items-center py-3 px-1 gap-1 bg-surface-900 border-l border-zinc-800">
            {PANELS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => {
                  if (activePanel === id && rightPanelOpen) {
                    setRightPanelOpen(false);
                  } else {
                    setActivePanel(id);
                  }
                }}
                className={`p-2 rounded transition-colors ${
                  activePanel === id && rightPanelOpen
                    ? 'bg-accent/20 text-accent'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          {/* Panel content */}
          {rightPanelOpen && (
            <div className="w-56 flex flex-col bg-surface-900 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300">
                  {PANELS.find((p) => p.id === activePanel)?.label}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activePanel === 'toc'        && <TableOfContents />}
                {activePanel === 'references' && <ReferencePanel />}
                {activePanel === 'changelog'  && <ChangelogPanel />}
                {activePanel === 'figures'    && <FiguresPanel />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {activeModal === 'docSettings'      && <DocumentSettingsModal />}
      {activeModal === 'export'           && <ExportModal />}
      {activeModal === 'templateSettings' && <TemplateSettingsModal />}
      {(activeModal === 'addRef' || activeModal === 'editRef') && <ReferenceModal />}

      {/* Theme toggle — fixed top-right */}
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed top-3 right-3 z-40 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors shadow-md"
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  );
}

function WelcomeScreen() {
  const createDocument = useDocumentStore((s) => s.createDocument);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto">
          <span className="text-2xl font-bold text-accent">B</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">ByteDoc</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Offline-first technical document editor
          </p>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Create structured technical reports with auto-numbering, citations,
          captions, and professional DOCX export. Everything saves locally in your browser.
        </p>
        <button
          type="button"
          onClick={() => createDocument('Untitled Document')}
          className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover transition-colors"
        >
          New Document
        </button>
      </div>
    </div>
  );
}
