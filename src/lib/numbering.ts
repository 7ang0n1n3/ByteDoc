// src/lib/numbering.ts
import type { Section } from '../types/document';
import type { SectionNode, CaptionEntry } from '../types/computed';
import type { JSONContent } from '@tiptap/core';

/** Build a tree of SectionNodes with auto-computed numbers from a flat list. */
export function buildSectionTree(sections: Section[]): SectionNode[] {
  if (sections.length === 0) return [];

  // Group children by parentId
  const childMap = new Map<string | null, Section[]>();
  for (const s of sections) {
    const key = s.parentId ?? null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(s);
  }
  // Sort each group by order
  for (const kids of childMap.values()) {
    kids.sort((a, b) => a.order - b.order);
  }

  function walk(parentId: string | null, prefix: string, depth: number): SectionNode[] {
    const kids = childMap.get(parentId) ?? [];
    return kids.map((section, idx) => {
      const number = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
      return {
        section,
        number,
        depth,
        children: walk(section.id, number, depth + 1),
      };
    });
  }

  return walk(null, '', 0);
}

/** Flatten a section tree into a depth-first ordered list. */
export function flattenTree(nodes: SectionNode[]): SectionNode[] {
  const result: SectionNode[] = [];
  function visit(node: SectionNode) {
    result.push(node);
    node.children.forEach(visit);
  }
  nodes.forEach(visit);
  return result;
}

/** Build a map of sectionId → number string. */
export function buildNumberMap(sections: Section[]): Map<string, string> {
  const tree = buildSectionTree(sections);
  const flat = flattenTree(tree);
  const map = new Map<string, string>();
  for (const node of flat) {
    map.set(node.section.id, node.number);
  }
  return map;
}

/** Extract figure and table captions from TipTap content, in DFS section order. */
export function extractCaptions(
  sections: Section[],
  sectionNumberMap: Map<string, string>
): { figures: CaptionEntry[]; tables: CaptionEntry[] } {
  const tree = buildSectionTree(sections);
  const flat = flattenTree(tree);

  const figures: CaptionEntry[] = [];
  const tables: CaptionEntry[] = [];
  let figCount = 0;
  let tblCount = 0;

  for (const node of flat) {
    scanContent(node.section.content, node.section.id);
  }

  function scanContent(content: JSONContent | undefined, sectionId: string) {
    if (!content) return;
    if (content.type === 'figureCaption') {
      figCount++;
      const title = extractText(content.content ?? []);
      figures.push({
        captionId: (content.attrs as Record<string, string>).figureId ?? '',
        sectionId,
        number: figCount,
        label: `Figure ${figCount}`,
        title,
      });
    } else if (content.type === 'tableCaption') {
      tblCount++;
      const title = extractText(content.content ?? []);
      tables.push({
        captionId: (content.attrs as Record<string, string>).captionId ?? '',
        sectionId,
        number: tblCount,
        label: `Table ${tblCount}`,
        title,
      });
    }
    if (content.content) {
      for (const child of content.content) {
        scanContent(child, sectionId);
      }
    }
  }

  return { figures, tables };
}

function extractText(nodes: JSONContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return (n as { type: string; text?: string }).text ?? '';
      if (n.content) return extractText(n.content);
      return '';
    })
    .join('');
}
