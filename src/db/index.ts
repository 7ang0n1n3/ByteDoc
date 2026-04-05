// src/db/index.ts
import Dexie, { type Table } from 'dexie';
import type { ByteDocument, Section, ChangelogEntry } from '../types/document';
import type { Reference, FootnoteData } from '../types/reference';
import type { DocxTemplate } from '../types/template';

export class ByteDocDB extends Dexie {
  documents!: Table<ByteDocument, string>;
  sections!:  Table<Section, string>;
  references!: Table<Reference, string>;
  footnotes!:  Table<FootnoteData, string>;
  changelog!:  Table<ChangelogEntry, string>;
  templates!:  Table<DocxTemplate, string>;

  constructor() {
    super('ByteDocDB');
    this.version(1).stores({
      documents:  '&id, updatedAt',
      sections:   '&id, documentId, parentId, order, [documentId+order]',
      references: '&id, documentId, order',
      footnotes:  '&id, documentId, sectionId',
      changelog:  '&id, documentId, order',
    });
    this.version(2).stores({
      documents:  '&id, updatedAt',
      sections:   '&id, documentId, parentId, order, [documentId+order]',
      references: '&id, documentId, order',
      footnotes:  '&id, documentId, sectionId',
      changelog:  '&id, documentId, order',
      templates:  '&id, isDefault',
    });
  }
}

export const db = new ByteDocDB();
