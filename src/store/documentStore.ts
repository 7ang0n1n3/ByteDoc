// src/store/documentStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import type { ByteDocument, Section, ChangelogEntry, DocumentId, SectionId } from '../types/document';
import type { Reference } from '../types/reference';
import type { JSONContent } from '@tiptap/core';
import { buildSectionTree, buildNumberMap, extractCaptions } from '../lib/numbering';
import type { SectionNode, CaptionEntry } from '../types/computed';

interface DocumentState {
  // Document list
  documents: ByteDocument[];
  activeDocumentId: DocumentId | null;
  activeDocument: ByteDocument | null;

  // Sections
  sections: Section[];
  activeSectionId: SectionId | null;

  // References & changelog
  references: Reference[];
  changelog: ChangelogEntry[];

  // Derived (recomputed automatically)
  sectionTree: SectionNode[];
  sectionNumberMap: Map<string, string>;
  figures: CaptionEntry[];
  tables: CaptionEntry[];

  // Actions — documents
  loadDocuments: () => Promise<void>;
  createDocument: (title: string) => Promise<DocumentId>;
  openDocument: (id: DocumentId) => Promise<void>;
  updateDocumentMeta: (updates: Partial<ByteDocument>) => Promise<void>;
  deleteDocument: (id: DocumentId) => Promise<void>;

  // Actions — sections
  addSection: (title: string, parentId?: SectionId | null) => Promise<SectionId>;
  updateSectionTitle: (id: SectionId, title: string) => Promise<void>;
  updateSectionContent: (id: SectionId, content: JSONContent) => Promise<void>;
  deleteSection: (id: SectionId) => Promise<void>;
  moveSection: (id: SectionId, newParentId: SectionId | null, newOrder: number) => Promise<void>;
  selectSection: (id: SectionId | null) => void;

  // Actions — references
  addReference: (ref: Omit<Reference, 'id' | 'documentId' | 'order' | 'createdAt'>) => Promise<void>;
  updateReference: (id: string, updates: Partial<Reference>) => Promise<void>;
  deleteReference: (id: string) => Promise<void>;

  // Actions — changelog
  addChangelogEntry: (entry: Omit<ChangelogEntry, 'id' | 'documentId' | 'order'>) => Promise<void>;
  deleteChangelogEntry: (id: string) => Promise<void>;
}

function recomputeDerived(sections: Section[]) {
  const sectionTree = buildSectionTree(sections);
  const sectionNumberMap = buildNumberMap(sections);
  const { figures, tables } = extractCaptions(sections, sectionNumberMap);
  return { sectionTree, sectionNumberMap, figures, tables };
}

export const useDocumentStore = create<DocumentState>()(
  subscribeWithSelector((set, get) => ({
    documents: [],
    activeDocumentId: null,
    activeDocument: null,
    sections: [],
    activeSectionId: null,
    references: [],
    changelog: [],
    sectionTree: [],
    sectionNumberMap: new Map(),
    figures: [],
    tables: [],

    loadDocuments: async () => {
      const docs = await db.documents.orderBy('updatedAt').reverse().toArray();
      set({ documents: docs });
    },

    createDocument: async (title: string) => {
      const id = uuid();
      const now = Date.now();
      const doc: ByteDocument = {
        id,
        title,
        subtitle: '',
        author: '',
        organization: '',
        version: '1.0',
        status: 'Draft',
        description: '',
        createdAt: now,
        updatedAt: now,
      };
      await db.documents.add(doc);
      const docs = await db.documents.orderBy('updatedAt').reverse().toArray();
      set({ documents: docs });
      await get().openDocument(id);
      return id;
    },

    openDocument: async (id: DocumentId) => {
      const [doc, sections, references, changelog] = await Promise.all([
        db.documents.get(id),
        db.sections.where('documentId').equals(id).toArray(),
        db.references.where('documentId').equals(id).toArray(),
        db.changelog.where('documentId').equals(id).toArray(),
      ]);
      if (!doc) return;

      references.sort((a, b) => a.order - b.order);
      changelog.sort((a, b) => a.order - b.order);

      // Select first section if none selected
      const firstSection = sections.sort((a, b) => a.order - b.order)[0];

      set({
        activeDocumentId: id,
        activeDocument: doc,
        sections,
        activeSectionId: firstSection?.id ?? null,
        references,
        changelog,
        ...recomputeDerived(sections),
      });
    },

    updateDocumentMeta: async (updates: Partial<ByteDocument>) => {
      const { activeDocumentId, activeDocument } = get();
      if (!activeDocumentId || !activeDocument) return;
      const updated = { ...activeDocument, ...updates, updatedAt: Date.now() };
      await db.documents.put(updated);
      const documents = await db.documents.orderBy('updatedAt').reverse().toArray();
      set({ activeDocument: updated, documents });
    },

    deleteDocument: async (id: DocumentId) => {
      await Promise.all([
        db.documents.delete(id),
        db.sections.where('documentId').equals(id).delete(),
        db.references.where('documentId').equals(id).delete(),
        db.changelog.where('documentId').equals(id).delete(),
        db.footnotes.where('documentId').equals(id).delete(),
      ]);
      const docs = await db.documents.orderBy('updatedAt').reverse().toArray();
      const { activeDocumentId } = get();
      if (activeDocumentId === id) {
        set({
          documents: docs,
          activeDocumentId: null,
          activeDocument: null,
          sections: [],
          activeSectionId: null,
          references: [],
          changelog: [],
          ...recomputeDerived([]),
        });
      } else {
        set({ documents: docs });
      }
    },

    addSection: async (title: string, parentId?: SectionId | null) => {
      const { activeDocumentId, sections } = get();
      if (!activeDocumentId) throw new Error('No active document');

      const siblings = sections.filter((s) => s.parentId === (parentId ?? null));
      const maxOrder = siblings.reduce((max, s) => Math.max(max, s.order), -1);
      const now = Date.now();
      const id = uuid();
      const section: Section = {
        id,
        documentId: activeDocumentId,
        parentId: parentId ?? null,
        title,
        order: maxOrder + 1,
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        createdAt: now,
        updatedAt: now,
      };
      await db.sections.add(section);
      const newSections = [...sections, section];
      set({ sections: newSections, activeSectionId: id, ...recomputeDerived(newSections) });
      return id;
    },

    updateSectionTitle: async (id: SectionId, title: string) => {
      const { sections } = get();
      const section = sections.find((s) => s.id === id);
      if (!section) return;
      const updated = { ...section, title, updatedAt: Date.now() };
      await db.sections.put(updated);
      const newSections = sections.map((s) => (s.id === id ? updated : s));
      set({ sections: newSections, ...recomputeDerived(newSections) });
    },

    updateSectionContent: async (id: SectionId, content: JSONContent) => {
      const { sections } = get();
      const section = sections.find((s) => s.id === id);
      if (!section) return;
      const updated = { ...section, content, updatedAt: Date.now() };
      await db.sections.put(updated);
      const newSections = sections.map((s) => (s.id === id ? updated : s));
      set({ sections: newSections, ...recomputeDerived(newSections) });
    },

    deleteSection: async (id: SectionId) => {
      const { sections, activeSectionId } = get();

      // Collect all descendant IDs
      const toDelete = new Set<string>();
      function collect(sId: string) {
        toDelete.add(sId);
        sections.filter((s) => s.parentId === sId).forEach((s) => collect(s.id));
      }
      collect(id);

      await db.sections.bulkDelete([...toDelete]);
      const newSections = sections.filter((s) => !toDelete.has(s.id));
      const newActive = toDelete.has(activeSectionId ?? '') ? (newSections[0]?.id ?? null) : activeSectionId;
      set({ sections: newSections, activeSectionId: newActive, ...recomputeDerived(newSections) });
    },

    moveSection: async (id: SectionId, newParentId: SectionId | null, newOrder: number) => {
      const { sections } = get();
      const section = sections.find((s) => s.id === id);
      if (!section) return;

      // Re-order siblings at the destination
      const siblings = sections
        .filter((s) => s.parentId === newParentId && s.id !== id)
        .sort((a, b) => a.order - b.order);

      // Insert at position
      siblings.splice(newOrder, 0, { ...section, parentId: newParentId });
      const reordered = siblings.map((s, i) => ({ ...s, order: i }));

      await db.sections.bulkPut(reordered);
      const newSections = sections.map((s) => {
        const r = reordered.find((r) => r.id === s.id);
        return r ?? s;
      });
      set({ sections: newSections, ...recomputeDerived(newSections) });
    },

    selectSection: (id: SectionId | null) => set({ activeSectionId: id }),

    addReference: async (ref) => {
      const { activeDocumentId, references } = get();
      if (!activeDocumentId) return;
      const id = uuid();
      const newRef: Reference = {
        ...ref,
        id,
        documentId: activeDocumentId,
        order: references.length,
        createdAt: Date.now(),
      };
      await db.references.add(newRef);
      set({ references: [...references, newRef] });
    },

    updateReference: async (id: string, updates: Partial<Reference>) => {
      const { references } = get();
      const ref = references.find((r) => r.id === id);
      if (!ref) return;
      const updated = { ...ref, ...updates };
      await db.references.put(updated);
      set({ references: references.map((r) => (r.id === id ? updated : r)) });
    },

    deleteReference: async (id: string) => {
      await db.references.delete(id);
      const { references } = get();
      set({ references: references.filter((r) => r.id !== id) });
    },

    addChangelogEntry: async (entry) => {
      const { activeDocumentId, changelog } = get();
      if (!activeDocumentId) return;
      const newEntry: ChangelogEntry = {
        id: uuid(),
        documentId: activeDocumentId,
        order: changelog.length,
        ...entry,
      };
      await db.changelog.add(newEntry);
      set({ changelog: [...changelog, newEntry] });
    },

    deleteChangelogEntry: async (id: string) => {
      await db.changelog.delete(id);
      const { changelog } = get();
      set({ changelog: changelog.filter((e) => e.id !== id) });
    },
  }))
);
