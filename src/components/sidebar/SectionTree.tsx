// src/components/sidebar/SectionTree.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useDocumentStore } from '../../store/documentStore';
import { flattenTree } from '../../lib/numbering';
import { SectionItem } from './SectionItem';

export function SectionTree() {
  const sectionTree = useDocumentStore((s) => s.sectionTree);
  const activeSectionId = useDocumentStore((s) => s.activeSectionId);
  const selectSection = useDocumentStore((s) => s.selectSection);
  const moveSection = useDocumentStore((s) => s.moveSection);

  // Track which section IDs are collapsed
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Full DFS list
  const allNodes = useMemo(() => flattenTree(sectionTree), [sectionTree]);
  const nodeById = useMemo(() => new Map(allNodes.map((node) => [node.section.id, node])), [allNodes]);

  // Filter out nodes whose ancestor is collapsed
  const visibleNodes = useMemo(
    () =>
      allNodes.filter((node) => {
        let parentId = node.section.parentId;
        while (parentId) {
          if (collapsed.has(parentId)) return false;
          const parent = nodeById.get(parentId);
          parentId = parent?.section.parentId ?? null;
        }
        return true;
      }),
    [allNodes, collapsed, nodeById]
  );

  const sortableIds = useMemo(() => visibleNodes.map((n) => n.section.id), [visibleNodes]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeNode = nodeById.get(String(active.id));
    const overNode = nodeById.get(String(over.id));
    if (!activeNode || !overNode) return;

    const targetParentId = overNode.section.parentId;
    const siblings = allNodes
      .filter((n) => n.section.parentId === targetParentId)
      .map((n) => n.section);
    const overIdx = siblings.findIndex((s) => s.id === over.id);

    moveSection(activeNode.section.id, targetParentId, Math.max(0, overIdx));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {visibleNodes.map((node) => (
            <SectionItem
              key={node.section.id}
              node={node}
              isActive={node.section.id === activeSectionId}
              isCollapsed={collapsed.has(node.section.id)}
              onSelect={selectSection}
              onToggleCollapse={toggleCollapse}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
