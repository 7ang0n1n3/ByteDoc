// src/components/toc/TableOfContents.tsx
import React from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { flattenTree } from '../../lib/numbering';

export function TableOfContents() {
  const sectionTree = useDocumentStore((s) => s.sectionTree);
  const activeSectionId = useDocumentStore((s) => s.activeSectionId);
  const selectSection = useDocumentStore((s) => s.selectSection);

  const flatNodes = flattenTree(sectionTree);

  if (flatNodes.length === 0) {
    return <p className="text-xs text-zinc-600 px-3 py-2">No sections yet</p>;
  }

  return (
    <nav className="px-2 py-2 space-y-0.5 text-sm">
      {flatNodes.map((node) => (
        <button
          key={node.section.id}
          type="button"
          onClick={() => selectSection(node.section.id)}
          className={`w-full flex items-baseline gap-2 px-2 py-1 rounded text-left transition-colors ${
            node.section.id === activeSectionId
              ? 'bg-accent/20 text-zinc-100'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
          style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
        >
          <span className="text-xs font-mono text-zinc-600 shrink-0 w-12 text-right">{node.number}</span>
          <span className="truncate">{node.section.title}</span>
        </button>
      ))}
    </nav>
  );
}
