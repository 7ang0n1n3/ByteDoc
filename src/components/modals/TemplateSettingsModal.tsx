// src/components/modals/TemplateSettingsModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Copy, Trash2, Upload, X } from 'lucide-react';
import { Modal } from './Modal';
import { useUIStore } from '../../store/uiStore';
import { useTemplateStore } from '../../store/templateStore';
import type { DocxTemplate } from '../../types/template';

const inputClass =
  'text-sm bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 outline-none focus:border-accent w-full';
const labelClass = 'text-xs font-medium text-zinc-400 block mb-1';
const sectionHeadClass = 'text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 pt-4 border-t border-zinc-800 first:border-t-0 first:pt-0';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hex = `#${value}`;
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value.replace('#', ''))}
          className="w-8 h-8 rounded border border-zinc-700 bg-zinc-900 cursor-pointer p-0.5"
        />
        <input
          className={`${inputClass} font-mono uppercase`}
          value={value}
          maxLength={6}
          onChange={(e) => onChange(e.target.value.replace('#', ''))}
        />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="number"
        className={inputClass}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 accent-accent"
      />
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

// Half-points → pt display, pt → half-points for storage
const toDisplay = (hp: number) => Math.round(hp / 2);
const toStorage = (pt: number) => pt * 2;

export function TemplateSettingsModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  const { templates, activeTemplateId, createTemplate, duplicateTemplate, updateTemplate, deleteTemplate, setActiveTemplate } =
    useTemplateStore();

  const [selectedId, setSelectedId] = useState<string | null>(activeTemplateId);
  const [form, setForm] = useState<DocxTemplate | null>(null);
  const [dirty, setDirty] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync form when selection changes
  useEffect(() => {
    const t = templates.find((t) => t.id === selectedId) ?? null;
    setForm(t ? { ...t } : null);
    setDirty(false);
  }, [selectedId, templates]);

  function patch<K extends keyof DocxTemplate>(key: K, value: DocxTemplate[K]) {
    if (!form) return;
    setForm((f) => f ? { ...f, [key]: value } : f);
    setDirty(true);
  }

  async function handleSave() {
    if (!form || !dirty) return;
    await updateTemplate(form.id, form);
    setDirty(false);
  }

  async function handleCreate() {
    const id = await createTemplate('New Template');
    setSelectedId(id);
  }

  async function handleDuplicate() {
    if (!selectedId) return;
    const id = await duplicateTemplate(selectedId);
    setSelectedId(id);
  }

  async function handleDelete() {
    if (!selectedId || templates.length <= 1) return;
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    await deleteTemplate(selectedId);
    setSelectedId(templates.find((t) => t.id !== selectedId)?.id ?? null);
  }

  function handleSelectForExport(id: string) {
    setActiveTemplate(id);
    setSelectedId(id);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setForm((f) => f ? {
          ...f,
          logoImage: dataUrl,
          logoWidth: img.naturalWidth,
          logoHeight: img.naturalHeight,
          logoPosition: f.logoPosition ?? 'upper-left',
        } : f);
        setDirty(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeLogo() {
    setForm((f) => f ? { ...f, logoImage: undefined, logoWidth: undefined, logoHeight: undefined } : f);
    setDirty(true);
  }

  return (
    <Modal title="DOCX Templates" onClose={closeModal} size="xl">
      <div className="flex gap-4 h-[520px]">
        {/* Template list */}
        <div className="w-44 shrink-0 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Templates</span>
            <button
              type="button"
              onClick={handleCreate}
              className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
              title="New template"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-2.5 py-2 rounded text-sm truncate transition-colors ${
                  selectedId === t.id
                    ? 'bg-accent/20 text-accent'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {t.name}
                {activeTemplateId === t.id && (
                  <span className="ml-1 text-xs text-zinc-500">(active)</span>
                )}
              </button>
            ))}
          </div>

          {form && (
            <div className="flex gap-1 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleDuplicate}
                title="Duplicate"
                className="flex-1 p-1.5 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-800 flex items-center justify-center"
              >
                <Copy size={13} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                title="Delete"
                disabled={templates.length <= 1}
                className="flex-1 p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 flex items-center justify-center disabled:opacity-30"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Template editor */}
        {form ? (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Name */}
            <Field label="Template Name">
              <input className={inputClass} value={form.name} onChange={(e) => patch('name', e.target.value)} />
            </Field>

            {/* Typography */}
            <p className={sectionHeadClass}>Typography</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Body Font">
                <input className={inputClass} value={form.bodyFont} onChange={(e) => patch('bodyFont', e.target.value)} />
              </Field>
              <Field label="Heading Font">
                <input className={inputClass} value={form.headingFont} onChange={(e) => patch('headingFont', e.target.value)} />
              </Field>
              <NumberField label="Body size (pt)" value={toDisplay(form.bodyFontSize)} onChange={(v) => patch('bodyFontSize', toStorage(v))} min={8} max={16} />
              <NumberField label="H1 size (pt)"   value={toDisplay(form.h1Size)} onChange={(v) => patch('h1Size', toStorage(v))} min={12} max={36} />
              <NumberField label="H2 size (pt)"   value={toDisplay(form.h2Size)} onChange={(v) => patch('h2Size', toStorage(v))} min={10} max={30} />
              <NumberField label="H3 size (pt)"   value={toDisplay(form.h3Size)} onChange={(v) => patch('h3Size', toStorage(v))} min={10} max={24} />
              <NumberField label="H4 size (pt)"   value={toDisplay(form.h4Size)} onChange={(v) => patch('h4Size', toStorage(v))} min={9} max={20} />
            </div>

            {/* Colors */}
            <p className={sectionHeadClass}>Colors</p>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="H1 / H2 color"         value={form.headingColor}         onChange={(v) => patch('headingColor', v)} />
              <ColorField label="H3 / H4 color"         value={form.subheadingColor}      onChange={(v) => patch('subheadingColor', v)} />
              <ColorField label="Accent (links/cites)"  value={form.accentColor}          onChange={(v) => patch('accentColor', v)} />
              <ColorField label="Table header fill"     value={form.tableHeaderFill}      onChange={(v) => patch('tableHeaderFill', v)} />
              <ColorField label="Table header text"     value={form.tableHeaderTextColor} onChange={(v) => patch('tableHeaderTextColor', v)} />
              <ColorField label="Table border"          value={form.tableBorderColor}     onChange={(v) => patch('tableBorderColor', v)} />
            </div>

            {/* Page Layout */}
            <p className={sectionHeadClass}>Page Layout</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Page size">
                <select className={inputClass} value={form.pageSize} onChange={(e) => patch('pageSize', e.target.value as 'A4' | 'Letter')}>
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                </select>
              </Field>
              <NumberField label="Top margin (in)"    value={form.marginTop}    onChange={(v) => patch('marginTop', v)}    min={0.25} max={3} step={0.25} />
              <NumberField label="Bottom margin (in)" value={form.marginBottom} onChange={(v) => patch('marginBottom', v)} min={0.25} max={3} step={0.25} />
              <NumberField label="Left margin (in)"   value={form.marginLeft}   onChange={(v) => patch('marginLeft', v)}   min={0.25} max={3} step={0.25} />
              <NumberField label="Right margin (in)"  value={form.marginRight}  onChange={(v) => patch('marginRight', v)}  min={0.25} max={3} step={0.25} />
            </div>

            {/* Header & Footer */}
            <p className={sectionHeadClass}>Header & Footer</p>
            <div className="space-y-2">
              <CheckField label="Show header (title + version)" checked={form.showHeader} onChange={(v) => patch('showHeader', v)} />
              <CheckField label="Show footer (page numbers)"    checked={form.showFooter} onChange={(v) => patch('showFooter', v)} />
            </div>

            {/* Front-matter sections */}
            <p className={sectionHeadClass}>Front Matter</p>
            <div className="space-y-2">
              <CheckField label="Title page"        checked={form.includeTitlePage}     onChange={(v) => patch('includeTitlePage', v)} />
              <CheckField label="Table of Contents" checked={form.includeToc}           onChange={(v) => patch('includeToc', v)} />
              <CheckField label="Changelog table"   checked={form.includeChangelog}     onChange={(v) => patch('includeChangelog', v)} />
              <CheckField label="List of Figures"   checked={form.includeListOfFigures} onChange={(v) => patch('includeListOfFigures', v)} />
              <CheckField label="List of Tables"    checked={form.includeListOfTables}  onChange={(v) => patch('includeListOfTables', v)} />
            </div>

            {/* Color bar */}
            <p className={sectionHeadClass}>Color Bar</p>
            <div className="space-y-3">
              <CheckField
                label="Enable color bar"
                checked={form.colorBarEnabled}
                onChange={(v) => patch('colorBarEnabled', v)}
              />
              {form.colorBarEnabled && (
                <ColorField
                  label="Bar color"
                  value={form.colorBarColor}
                  onChange={(v) => patch('colorBarColor', v)}
                />
              )}
              {form.colorBarEnabled && (
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Regular pages: horizontal bar across the top.<br />
                  Title page: vertical bar on the left (25% of page width).
                </p>
              )}
            </div>

            {/* Watermark */}
            <p className={sectionHeadClass}>Watermark</p>
            <div className="space-y-3">
              <CheckField
                label="Enable watermark"
                checked={form.watermarkEnabled ?? false}
                onChange={(v) => patch('watermarkEnabled', v)}
              />
              {(form.watermarkEnabled ?? false) && (
                <>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    The document's status (Draft / Review / Final) is printed diagonally across each page at font size 64.
                  </p>
                  <NumberField
                    label="Visibility (1 = faint · 100 = solid)"
                    value={form.watermarkOpacity ?? 20}
                    onChange={(v) => patch('watermarkOpacity', v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </>
              )}
            </div>

            {/* Title page logo */}
            <p className={sectionHeadClass}>Title Page Logo</p>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

            {form.logoImage ? (
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-24 h-14 bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center overflow-hidden">
                  <img src={form.logoImage} alt="Logo preview" className="max-w-full max-h-full object-contain p-1" />
                </div>
                <div className="flex-1 space-y-2">
                  <Field label="Position">
                    <select
                      className={inputClass}
                      value={form.logoPosition ?? 'upper-left'}
                      onChange={(e) => patch('logoPosition', e.target.value as DocxTemplate['logoPosition'])}
                    >
                      <option value="upper-left">Upper left</option>
                      <option value="upper-right">Upper right</option>
                      <option value="above-title">Above title (centered)</option>
                    </select>
                  </Field>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors"
                  >
                    <X size={11} /> Remove logo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 text-xs px-3 py-2 border border-dashed border-zinc-700 rounded text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors w-full justify-center"
              >
                <Upload size={13} />
                Upload image
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
            Select a template to edit
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">
          {form && activeTemplateId !== form.id && (
            <button
              type="button"
              onClick={() => handleSelectForExport(form.id)}
              className="text-accent hover:text-accent/80 transition-colors"
            >
              Use for export
            </button>
          )}
          {form && activeTemplateId === form.id && (
            <span className="text-zinc-600">Active template for export</span>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={closeModal} className="text-sm px-4 py-1.5 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600">
            Close
          </button>
          {form && dirty && (
            <button type="button" onClick={handleSave} className="text-sm px-4 py-1.5 bg-accent text-white rounded hover:bg-accent-hover">
              Save
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
