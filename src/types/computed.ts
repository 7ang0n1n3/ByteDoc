// src/types/computed.ts
import type { Section } from './document';

export interface SectionNode {
  section: Section;
  number: string;        // e.g. "1.2.3"
  depth: number;         // 0-based
  children: SectionNode[];
}

export interface CaptionEntry {
  captionId: string;
  sectionId: string;
  number: number;
  label: string;         // e.g. "Figure 3" or "Table 1"
  title: string;
}
