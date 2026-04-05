// src/types/template.ts

export interface DocxTemplate {
  id: string;
  name: string;
  isDefault: boolean;

  // Typography (font names as strings, sizes in half-points: 22 = 11pt)
  bodyFont: string;
  headingFont: string;
  bodyFontSize: number;
  h1Size: number;
  h2Size: number;
  h3Size: number;
  h4Size: number;

  // Colors — hex WITHOUT '#'
  headingColor: string;
  subheadingColor: string;
  accentColor: string;
  tableHeaderFill: string;
  tableHeaderTextColor: string;
  tableBorderColor: string;

  // Page layout (inches)
  pageSize: 'A4' | 'Letter';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;

  // Header / footer visibility
  showHeader: boolean;
  showFooter: boolean;

  // Front-matter sections
  includeTitlePage: boolean;
  includeToc: boolean;
  includeChangelog: boolean;
  includeListOfFigures: boolean;
  includeListOfTables: boolean;

  // Title page logo (optional)
  logoImage?: string;                                        // base64 data URL
  logoWidth?: number;                                        // natural pixel width
  logoHeight?: number;                                       // natural pixel height
  logoPosition?: 'upper-left' | 'upper-right' | 'above-title';

  // Color bar
  colorBarEnabled: boolean;
  colorBarColor: string;                                     // hex WITHOUT '#'

  // Watermark
  watermarkEnabled: boolean;
  watermarkOpacity: number;                                  // 1–100 (default 20)
}

export const DEFAULT_TEMPLATE: Omit<DocxTemplate, 'id'> = {
  name: 'Default',
  isDefault: true,

  bodyFont: 'Calibri',
  headingFont: 'Calibri',
  bodyFontSize: 22,   // 11pt
  h1Size: 36,         // 18pt
  h2Size: 32,         // 16pt
  h3Size: 28,         // 14pt
  h4Size: 24,         // 12pt

  headingColor: '1F3864',
  subheadingColor: '2E4057',
  accentColor: '6366F1',
  tableHeaderFill: '1e1e3a',
  tableHeaderTextColor: 'FFFFFF',
  tableBorderColor: '404040',

  pageSize: 'A4',
  marginTop: 1.0,
  marginBottom: 1.0,
  marginLeft: 1.25,
  marginRight: 1.0,

  showHeader: true,
  showFooter: true,

  includeTitlePage: true,
  includeToc: true,
  includeChangelog: true,
  includeListOfFigures: true,
  includeListOfTables: true,

  logoImage: undefined,
  logoWidth: undefined,
  logoHeight: undefined,
  logoPosition: undefined,

  colorBarEnabled: false,
  colorBarColor: '6366F1',

  watermarkEnabled: false,
  watermarkOpacity: 20,
};
