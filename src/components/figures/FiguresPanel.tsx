// src/components/figures/FiguresPanel.tsx
import React from 'react';
import { useDocumentStore } from '../../store/documentStore';

export function FiguresPanel() {
  const figures = useDocumentStore((s) => s.figures);
  const tables = useDocumentStore((s) => s.tables);
  const selectSection = useDocumentStore((s) => s.selectSection);

  return (
    <div className="px-2 py-2 space-y-4">
      {/* Figures */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-1">
          Figures ({figures.length})
        </p>
        {figures.length === 0 ? (
          <p className="text-xs text-zinc-600 px-2 py-2">
            No figures yet. Use "Insert Figure Caption" in the editor.
          </p>
        ) : (
          <div className="space-y-0.5">
            {figures.map((fig) => (
              <button
                key={fig.captionId}
                type="button"
                onClick={() => selectSection(fig.sectionId)}
                className="w-full flex items-baseline gap-2 px-2 py-1 rounded text-left hover:bg-zinc-800 transition-colors"
              >
                <span className="text-xs font-mono text-accent shrink-0">{fig.label}</span>
                <span className="text-xs text-zinc-400 truncate">{fig.title || '(untitled)'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tables */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-1">
          Tables ({tables.length})
        </p>
        {tables.length === 0 ? (
          <p className="text-xs text-zinc-600 px-2 py-2">
            No table captions yet. Use "Insert Table Caption" in the editor.
          </p>
        ) : (
          <div className="space-y-0.5">
            {tables.map((tbl) => (
              <button
                key={tbl.captionId}
                type="button"
                onClick={() => selectSection(tbl.sectionId)}
                className="w-full flex items-baseline gap-2 px-2 py-1 rounded text-left hover:bg-zinc-800 transition-colors"
              >
                <span className="text-xs font-mono text-accent shrink-0">{tbl.label}</span>
                <span className="text-xs text-zinc-400 truncate">{tbl.title || '(untitled)'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
