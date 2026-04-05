// src/store/templateStore.ts
import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import type { DocxTemplate } from '../types/template';
import { DEFAULT_TEMPLATE } from '../types/template';

interface TemplateState {
  templates: DocxTemplate[];
  activeTemplateId: string | null;

  loadTemplates: () => Promise<void>;
  createTemplate: (name: string) => Promise<string>;
  duplicateTemplate: (id: string) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<DocxTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setActiveTemplate: (id: string | null) => void;
  getActiveTemplate: () => DocxTemplate | null;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  activeTemplateId: null,

  loadTemplates: async () => {
    let templates = await db.templates.toArray();

    // Seed the default template on first run
    if (templates.length === 0) {
      const defaultId = uuid();
      const defaultTemplate: DocxTemplate = { ...DEFAULT_TEMPLATE, id: defaultId };
      await db.templates.add(defaultTemplate);
      templates = [defaultTemplate];
    }

    const activeId = templates.find((t) => t.isDefault)?.id ?? templates[0]?.id ?? null;
    set({ templates, activeTemplateId: activeId });
  },

  createTemplate: async (name: string) => {
    const id = uuid();
    const template: DocxTemplate = { ...DEFAULT_TEMPLATE, id, name, isDefault: false };
    await db.templates.add(template);
    const templates = await db.templates.toArray();
    set({ templates });
    return id;
  },

  duplicateTemplate: async (id: string) => {
    const source = get().templates.find((t) => t.id === id);
    if (!source) throw new Error('Template not found');
    const newId = uuid();
    const copy: DocxTemplate = { ...source, id: newId, name: `${source.name} (copy)`, isDefault: false };
    await db.templates.add(copy);
    const templates = await db.templates.toArray();
    set({ templates });
    return newId;
  },

  updateTemplate: async (id: string, updates: Partial<DocxTemplate>) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return;
    const updated = { ...template, ...updates };
    await db.templates.put(updated);
    set({ templates: get().templates.map((t) => (t.id === id ? updated : t)) });
  },

  deleteTemplate: async (id: string) => {
    const { templates, activeTemplateId } = get();
    if (templates.length <= 1) return; // always keep at least one
    await db.templates.delete(id);
    const remaining = templates.filter((t) => t.id !== id);
    const newActiveId = activeTemplateId === id
      ? (remaining.find((t) => t.isDefault)?.id ?? remaining[0]?.id ?? null)
      : activeTemplateId;
    set({ templates: remaining, activeTemplateId: newActiveId });
  },

  setActiveTemplate: (id) => set({ activeTemplateId: id }),

  getActiveTemplate: () => {
    const { templates, activeTemplateId } = get();
    return templates.find((t) => t.id === activeTemplateId) ?? templates[0] ?? null;
  },
}));
