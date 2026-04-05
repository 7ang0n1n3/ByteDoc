// src/types/document.ts
import type { JSONContent } from '@tiptap/core';

export type DocumentId = string;
export type SectionId  = string;

export interface ByteDocument {
  id: DocumentId;
  title: string;
  subtitle: string;
  author: string;
  organization: string;
  version: string;
  status: 'Draft' | 'Review' | 'Final';
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface Section {
  id: SectionId;
  documentId: DocumentId;
  parentId: SectionId | null;
  title: string;
  order: number;
  content: JSONContent;
  createdAt: number;
  updatedAt: number;
}

export interface ChangelogEntry {
  id: string;
  documentId: DocumentId;
  version: string;
  date: number;
  author: string;
  description: string;
  order: number;
}
