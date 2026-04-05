// src/components/sidebar/SectionItem.tsx
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import type { SectionNode } from '../../types/computed';
import { useDocumentStore } from '../../store/documentStore';

interface SectionItemProps {
  node: SectionNode;
  isActive: boolean;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
}

export function SectionItem({ node, isActive, isCollapsed, onSelect, onToggleCollapse }: SectionItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.section.title);

  const addSection = useDocumentStore((s) => s.addSection);
  const deleteSection = useDocumentStore((s) => s.deleteSection);
  const updateTitle = useDocumentStore((s) => s.updateSectionTitle);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    paddingLeft: `${node.depth * 16 + 8}px`,
  };

  const hasChildren = node.children.length > 0;

  async function handleAddChild() {
    await addSection('New Section', node.section.id);
  }

  async function handleDelete() {
    if (window.confirm(`Delete "${node.section.title}" and all subsections?`)) {
      deleteSection(node.section.id);
    }
  }

  function commitEdit() {
    if (editTitle.trim()) updateTitle(node.section.id, editTitle.trim());
    setEditing(false);
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-1 pr-2 py-1 rounded-md cursor-pointer transition-colors ${
          isActive ? 'bg-accent/20 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
        onClick={() => !editing && onSelect(node.section.id)}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-70 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </span>

        {/* Expand/collapse */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.section.id); }}
          className={`shrink-0 transition-transform ${hasChildren ? 'opacity-50 hover:opacity-100' : 'invisible'}`}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Number */}
        <span className={`text-xs font-mono shrink-0 ${isActive ? 'text-accent' : 'text-zinc-600'}`}>
          {node.number}
        </span>

        {/* Title (editable) */}
        {editing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') { setEditing(false); setEditTitle(node.section.title); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm bg-zinc-900 border border-accent rounded px-1 outline-none text-zinc-100"
          />
        ) : (
          <span className="flex-1 text-sm truncate">{node.section.title}</span>
        )}

        {/* Action buttons */}
        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
          {editing ? (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); commitEdit(); }} className="p-0.5 text-green-400 hover:text-green-300">
                <Check size={12} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(false); setEditTitle(node.section.title); }} className="p-0.5 text-zinc-500 hover:text-zinc-300">
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="p-0.5 hover:text-zinc-100">
                <Pencil size={12} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleAddChild(); }} className="p-0.5 hover:text-zinc-100" title="Add subsection">
                <Plus size={12} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-0.5 hover:text-red-400" title="Delete">
                <Trash2 size={12} />
              </button>
            </>
          )}
        </span>
      </div>

      {/* Children are rendered by SectionTree's flat list — no recursion here */}
    </>
  );
}
