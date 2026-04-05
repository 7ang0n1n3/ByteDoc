// src/types/reference.ts
export type ReferenceType = 'book' | 'article' | 'website' | 'conference' | 'other';

export interface Reference {
  id: string;
  documentId: string;
  type: ReferenceType;
  authors: string;
  title: string;
  year: string;
  publisher: string;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
  order: number;
  createdAt: number;
}

export type ReferenceInput = Omit<Reference, 'id' | 'documentId' | 'order' | 'createdAt'>;

export interface FootnoteData {
  id: string;
  documentId: string;
  sectionId: string;
  content: string;
  order: number;
}
