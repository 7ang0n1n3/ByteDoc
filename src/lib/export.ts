// src/lib/export.ts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
  BorderStyle,
  WidthType,
  PageBreak,
  ExternalHyperlink,
  ImageRun,
  TableOfContents,
  convertInchesToTwip,
  UnderlineType,
  ShadingType,
  TabStopType,
  TabStopPosition,
  LineRuleType,
  ImportedXmlComponent,
  TableAnchorType,
} from 'docx';
import type { ISectionOptions } from 'docx';
import { saveAs } from 'file-saver';
import type { ByteDocument, Section, ChangelogEntry } from '../types/document';
import type { Reference } from '../types/reference';
import type { SectionNode } from '../types/computed';
import { buildSectionTree, flattenTree } from './numbering';
import type { JSONContent } from '@tiptap/core';
import type { DocxTemplate } from '../types/template';
import { DEFAULT_TEMPLATE } from '../types/template';

// ─── Page dimensions ──────────────────────────────────────────────────────────

const PAGE_SIZES = {
  A4:     { width: convertInchesToTwip(8.27),  height: convertInchesToTwip(11.69) },
  Letter: { width: convertInchesToTwip(8.5),   height: convertInchesToTwip(11)    },
} as const;

// ─── Inline node conversion ──────────────────────────────────────────────────

interface RunOptions {
  bold?: boolean;
  italics?: boolean;
  underline?: object;
  strike?: boolean;
  code?: boolean;
  color?: string;
  highlight?: string;
  superScript?: boolean;
  subScript?: boolean;
}

function marksToOptions(marks: JSONContent['marks'] = []): RunOptions {
  const opts: RunOptions = {};
  for (const mark of marks) {
    if (!mark) continue;
    switch (mark.type) {
      case 'bold':      opts.bold = true; break;
      case 'italic':    opts.italics = true; break;
      case 'underline': opts.underline = { type: UnderlineType.SINGLE }; break;
      case 'strike':    opts.strike = true; break;
      case 'code':      opts.code = true; break;
      case 'superscript': opts.superScript = true; break;
      case 'subscript':   opts.subScript = true; break;
      case 'highlight': opts.highlight = (mark.attrs as { color?: string } | undefined)?.color ?? 'yellow'; break;
      case 'textStyle': {
        const color = (mark.attrs as { color?: string } | undefined)?.color;
        if (color) opts.color = color.replace('#', '');
        break;
      }
    }
  }
  return opts;
}

function textNodeToRun(node: JSONContent, extraOpts: RunOptions = {}): TextRun {
  const text = (node as { text?: string }).text ?? '';
  const markOpts = marksToOptions(node.marks ?? []);
  const opts = { ...markOpts, ...extraOpts };
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italics,
    underline: opts.underline,
    strike: opts.strike,
    font: opts.code ? 'Courier New' : undefined,
    color: opts.color,
    superScript: opts.superScript,
    subScript: opts.subScript,
    shading: opts.highlight
      ? { type: ShadingType.CLEAR, fill: 'FFFF00', color: 'auto' }
      : undefined,
  });
}

function inlineToRuns(nodes: JSONContent[] = [], accentColor = '6366f1'): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      const linkMark = node.marks?.find((m) => m.type === 'link');
      if (linkMark) {
        const href = (linkMark.attrs as { href?: string } | undefined)?.href ?? '';
        runs.push(
          new ExternalHyperlink({
            link: href,
            children: [textNodeToRun(node, { color: accentColor, underline: { type: UnderlineType.SINGLE } })],
          })
        );
      } else {
        runs.push(textNodeToRun(node));
      }
    } else if (node.type === 'hardBreak') {
      runs.push(new TextRun({ break: 1 }));
    } else if (node.type === 'citation') {
      const num = (node.attrs as { refNum?: number } | undefined)?.refNum ?? '?';
      runs.push(new TextRun({ text: `[${num}]`, color: accentColor }));
    } else if (node.type === 'footnote') {
      const num = (node.attrs as { number?: number } | undefined)?.number ?? '*';
      runs.push(new TextRun({ text: `${num}`, superScript: true }));
    }
  }
  return runs;
}

// ─── Block node conversion ───────────────────────────────────────────────────

function convertNode(
  node: JSONContent,
  sectionDepth: number,
  figureNumbers: Map<string, number>,
  tableNumbers: Map<string, number>,
  template: DocxTemplate,
  listLevel = 0
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  const content = node.content ?? [];
  const accent = template.accentColor;

  switch (node.type) {
    case 'paragraph': {
      const align = (node.attrs as { textAlign?: string } | undefined)?.textAlign;
      result.push(new Paragraph({
        alignment: alignmentFromString(align),
        children: inlineToRuns(content, accent),
      }));
      break;
    }

    case 'heading': {
      const level = (node.attrs as { level?: number } | undefined)?.level ?? 1;
      const headingLevels = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ];
      result.push(new Paragraph({
        heading: headingLevels[Math.min(level - 1, 5)],
        children: inlineToRuns(content, accent),
      }));
      break;
    }

    case 'bulletList': {
      for (const item of content) {
        const itemContent = item.content ?? [];
        for (const block of itemContent) {
          if (block.type === 'paragraph') {
            result.push(new Paragraph({
              bullet: { level: listLevel },
              children: inlineToRuns(block.content ?? [], accent),
            }));
          } else {
            result.push(...convertNode(block, sectionDepth, figureNumbers, tableNumbers, template, listLevel + 1));
          }
        }
      }
      break;
    }

    case 'orderedList': {
      for (const item of content) {
        const itemContent = item.content ?? [];
        for (const block of itemContent) {
          if (block.type === 'paragraph') {
            result.push(new Paragraph({
              numbering: { reference: 'ordered-list', level: listLevel },
              children: inlineToRuns(block.content ?? [], accent),
            }));
          } else {
            result.push(...convertNode(block, sectionDepth, figureNumbers, tableNumbers, template, listLevel + 1));
          }
        }
      }
      break;
    }

    case 'blockquote': {
      for (const child of content) {
        if (child.type === 'paragraph') {
          result.push(new Paragraph({
            indent: { left: convertInchesToTwip(0.5) },
            children: [
              new TextRun({ text: '', italics: true }),
              ...inlineToRuns(child.content ?? [], accent).map((run) => {
                if (run instanceof TextRun) return new TextRun({ ...run, italics: true });
                return run;
              }),
            ],
          }));
        } else {
          result.push(...convertNode(child, sectionDepth, figureNumbers, tableNumbers, template));
        }
      }
      break;
    }

    case 'codeBlock': {
      const codeText = content.map((n) => (n as { text?: string }).text ?? '').join('');
      result.push(new Paragraph({
        children: [new TextRun({ text: codeText, font: 'Courier New', size: 18 })],
        shading: { type: ShadingType.CLEAR, fill: '1A1A2E', color: 'auto' },
      }));
      break;
    }

    case 'pageBreak': {
      result.push(new Paragraph({ children: [new PageBreak()] }));
      break;
    }

    case 'horizontalRule': {
      result.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: template.tableBorderColor } },
        children: [],
      }));
      break;
    }

    case 'figureCaption': {
      const figureId = (node.attrs as { figureId?: string } | undefined)?.figureId ?? '';
      const num = figureNumbers.get(figureId) ?? '?';
      const text = extractTextFromContent(content);
      result.push(new Paragraph({
        style: 'Caption',
        children: [new TextRun({ text: `Figure ${num}: ${text}`, italics: true, color: '888888' })],
        alignment: AlignmentType.CENTER,
      }));
      break;
    }

    case 'tableCaption': {
      const captionId = (node.attrs as { captionId?: string } | undefined)?.captionId ?? '';
      const num = tableNumbers.get(captionId) ?? '?';
      const text = extractTextFromContent(content);
      result.push(new Paragraph({
        style: 'Caption',
        children: [new TextRun({ text: `Table ${num}: ${text}`, italics: true, color: '888888' })],
        alignment: AlignmentType.CENTER,
      }));
      break;
    }

    case 'table': {
      const borderColor = template.tableBorderColor;
      const rows = content.map((row) => {
        const cells = (row.content ?? []).map((cell) => {
          const cellContent = cell.content ?? [];
          const cellParagraphs: Paragraph[] = [];
          for (const block of cellContent) {
            const converted = convertNode(block, sectionDepth, figureNumbers, tableNumbers, template);
            cellParagraphs.push(...(converted.filter((n) => n instanceof Paragraph) as Paragraph[]));
          }
          const isHeader = cell.type === 'tableHeader';
          return new TableCell({
            children: cellParagraphs.length > 0 ? cellParagraphs : [new Paragraph({ children: [] })],
            shading: isHeader
              ? { type: ShadingType.CLEAR, fill: template.tableHeaderFill, color: 'auto' }
              : undefined,
          });
        });
        return new TableRow({ children: cells });
      });
      result.push(
        new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top:              { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            bottom:           { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            left:             { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            right:            { style: BorderStyle.SINGLE, size: 4, color: borderColor },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: borderColor },
            insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: borderColor },
          },
        })
      );
      break;
    }

    case 'image': {
      const src = (node.attrs as { src?: string } | undefined)?.src ?? '';
      if (src.startsWith('data:image/')) {
        try {
          const base64Data = src.split(',')[1];
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
          const width = (node.attrs as { width?: number } | undefined)?.width ?? 400;
          const height = (node.attrs as { height?: number } | undefined)?.height ?? 300;
          result.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: bytes,
                transformation: {
                  width: Math.min(width, 600),
                  height: Math.min(height, 450),
                },
              }),
            ],
          }));
        } catch {
          result.push(new Paragraph({ children: [new TextRun({ text: '[Image]', color: '888888' })] }));
        }
      }
      break;
    }

    default:
      // Recurse on unknown block nodes
      for (const child of content) {
        result.push(...convertNode(child, sectionDepth, figureNumbers, tableNumbers, template, listLevel));
      }
  }

  return result;
}

function alignmentFromString(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  switch (align) {
    case 'center':  return AlignmentType.CENTER;
    case 'right':   return AlignmentType.RIGHT;
    case 'justify': return AlignmentType.JUSTIFIED;
    default:        return AlignmentType.LEFT;
  }
}

function extractTextFromContent(nodes: JSONContent[]): string {
  return nodes.map((n) => {
    if (n.type === 'text') return (n as { text?: string }).text ?? '';
    if (n.content) return extractTextFromContent(n.content);
    return '';
  }).join('');
}

// ─── Caption number maps ─────────────────────────────────────────────────────

function buildCaptionMaps(flatNodes: SectionNode[]) {
  const figureNumbers = new Map<string, number>();
  const tableNumbers = new Map<string, number>();
  let figCount = 0;
  let tblCount = 0;

  function scan(content: JSONContent) {
    if (content.type === 'figureCaption') {
      figCount++;
      figureNumbers.set((content.attrs as { figureId?: string } | undefined)?.figureId ?? '', figCount);
    } else if (content.type === 'tableCaption') {
      tblCount++;
      tableNumbers.set((content.attrs as { captionId?: string } | undefined)?.captionId ?? '', tblCount);
    }
    if (content.content) content.content.forEach(scan);
  }

  for (const node of flatNodes) scan(node.section.content);
  return { figureNumbers, tableNumbers };
}

// ─── Section → docx children ─────────────────────────────────────────────────

function sectionToDocxChildren(
  node: SectionNode,
  figureNumbers: Map<string, number>,
  tableNumbers: Map<string, number>,
  template: DocxTemplate
): (Paragraph | Table)[] {
  const headingLevels = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ];
  const headingLevel = headingLevels[Math.min(node.depth, 5)];

  const heading = new Paragraph({
    heading: headingLevel,
    children: [new TextRun({ text: `${node.number}  ${node.section.title}` })],
    spacing: { after: 240 },
  });

  const contentBlocks: (Paragraph | Table)[] = [];
  const docContent = node.section.content?.content ?? [];
  for (const block of docContent) {
    contentBlocks.push(...convertNode(block, node.depth, figureNumbers, tableNumbers, template));
  }

  const trailingBlank = new Paragraph({ children: [new TextRun('')], spacing: { after: 240 } });
  return [heading, ...contentBlocks, trailingBlank];
}

// ─── Page elements ────────────────────────────────────────────────────────────

// Builds a drawingML-anchored diagonal watermark paragraph for DOCX headers.
// Uses wp:anchor (behindDoc=1, centered on margin) with a wps text box rotated
// -45°. VML was avoided because it requires a pre-declared v:shapetype that the
// docx library does not emit, causing silent render failures.
//
// Visibility: opacity 1 → near-white (#FDFDFD), 100 → dark gray (#3F3F3F).
// Font size: 64 pt (w:sz = 128 half-points).
// Returns a NEW paragraph instance each call — the same XmlComponent object must
// not be placed in more than one Header, or only the first will serialise it.
// Compact single-line XML avoids whitespace text-nodes that xml-js would inject
// into the XmlComponent tree and potentially corrupt the element order.
// positionV relativeFrom="page" centres the watermark on the full physical page
// (not just the header area, which sits near the top of the page).
function buildWatermarkParagraph(text: string, opacity: number): Paragraph {
  const clamped  = Math.max(1, Math.min(100, opacity));
  const gray     = Math.round(255 - (clamped / 100) * 192);
  const hexByte  = gray.toString(16).padStart(2, '0').toUpperCase();
  const colorHex = `${hexByte}${hexByte}${hexByte}`;

  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Single compact line — no whitespace text nodes
  const xml =
    `<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">` +
    `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing>` +
    `<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">` +
    `<wp:simplePos x="0" y="0"/>` +
    `<wp:positionH relativeFrom="margin"><wp:align>center</wp:align></wp:positionH>` +
    `<wp:positionV relativeFrom="page"><wp:align>center</wp:align></wp:positionV>` +
    `<wp:extent cx="6858000" cy="1714500"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:wrapNone/>` +
    `<wp:docPr id="9001" name="Watermark"/>` +
    `<wp:cNvGraphicFramePr/>` +
    `<a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">` +
    `<wps:wsp><wps:cNvSpPr txBx="1"/><wps:spPr>` +
    `<a:xfrm rot="-2700000"><a:off x="0" y="0"/><a:ext cx="6858000" cy="1714500"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
    `<a:noFill/><a:ln><a:noFill/></a:ln>` +
    `</wps:spPr>` +
    `<wps:txbx><w:txbxContent><w:p>` +
    `<w:pPr><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:color w:val="${colorHex}"/><w:sz w:val="128"/><w:szCs w:val="128"/></w:rPr>` +
    `<w:t>${safeText}</w:t></w:r>` +
    `</w:p></w:txbxContent></wps:txbx>` +
    `<wps:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" anchorCtr="1"><a:noAutofit/></wps:bodyPr>` +
    `</wps:wsp></a:graphicData></a:graphic>` +
    `</wp:anchor></w:drawing></w:r></w:p>`;

  // fromXmlString returns an XML *document* wrapper (rootKey=undefined) whose
  // first child is the actual <w:p> element. Unwrap it before returning.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ImportedXmlComponent.fromXmlString(xml) as any).root[0] as unknown as Paragraph;
}

function buildLogoRun(template: DocxTemplate): ImageRun | null {
  if (!template.logoImage?.startsWith('data:image/')) return null;
  try {
    const base64 = template.logoImage.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const MAX_W = 160;
    const MAX_H = 90;
    const origW = template.logoWidth  || MAX_W;
    const origH = template.logoHeight || MAX_H;
    const scale = Math.min(MAX_W / origW, MAX_H / origH, 1);

    return new ImageRun({
      data: bytes,
      transformation: {
        width:  Math.round(origW * scale),
        height: Math.round(origH * scale),
      },
    });
  } catch {
    return null;
  }
}

// ─── Title page content paragraphs (shared between plain and bar layouts) ────

function titleContentParagraphs(doc: ByteDocument, template: DocxTemplate, logoRun: ImageRun | null): (Paragraph | null)[] {
  const position = template.logoPosition ?? 'upper-left';

  const logoCorner = logoRun && position !== 'above-title'
    ? new Paragraph({
        alignment: position === 'upper-right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { after: 600 },
        children: [logoRun],
      })
    : null;

  const logoAbove = logoRun && position === 'above-title'
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 400 },
        children: [logoRun],
      })
    : null;

  return [
    logoCorner,
    logoAbove,
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: doc.title, size: template.h1Size, bold: true, font: template.headingFont })],
      spacing: { before: logoAbove ? 200 : 2000, after: 400 },
    }),
    doc.subtitle
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: doc.subtitle, size: template.h3Size, italics: true, color: '888888', font: template.headingFont })],
          spacing: { after: 800 },
        })
      : null,
    doc.author
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: doc.author, size: template.bodyFontSize + 2, font: template.bodyFont })],
        })
      : null,
    doc.organization
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: doc.organization, size: template.bodyFontSize, color: '888888', font: template.bodyFont })],
        })
      : null,
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), size: template.bodyFontSize, font: template.bodyFont })],
      spacing: { before: 400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Version ${doc.version}  ·  ${doc.status}`, size: template.bodyFontSize - 2, color: '888888', font: template.bodyFont })],
      spacing: { before: 200 },
    }),
  ];
}

// ─── No-border helper ────────────────────────────────────────────────────────

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'auto' } as const;
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };

// ─── Title page ───────────────────────────────────────────────────────────────

function titlePageChildren(doc: ByteDocument, template: DocxTemplate): (Paragraph | Table)[] {
  const logoRun = buildLogoRun(template);
  const content = titleContentParagraphs(doc, template, logoRun).filter(Boolean) as Paragraph[];
  return content;
}

// ─── Color-bar title page section ────────────────────────────────────────────
// Uses Table.float (w:tblpPr) to anchor the two-column table at absolute page
// coordinates (0, 0). This completely bypasses the section margin system, so
// the colour bar left cell starts exactly at the physical top-left corner with
// no gap — regardless of what the page margins are set to.
//
// The section keeps normal top/bottom/right margins. The left margin is shifted
// to barWidth + 0.3 in so any non-floating body content clears the bar visually.

function buildColorBarTitlePageSection(
  doc: ByteDocument,
  t: DocxTemplate,
  pageSize: { width: number; height: number },
  watermarkParagraph: Paragraph | null,
) {
  const pageWidthTwips  = pageSize.width;
  const pageHeightTwips = pageSize.height;
  const barWidthTwips   = Math.round(pageWidthTwips * 0.25);
  const restWidthTwips  = pageWidthTwips - barWidthTwips;

  const logoRun = buildLogoRun(t);
  const content = titleContentParagraphs(doc, t, logoRun).filter(Boolean) as Paragraph[];

  const titleTable = new Table({
    width:   { size: pageWidthTwips, type: WidthType.DXA },
    borders: NO_BORDERS,
    // Anchor the table to the physical page corner — zero top gap guaranteed
    float: {
      horizontalAnchor: TableAnchorType.PAGE,
      verticalAnchor:   TableAnchorType.PAGE,
      absoluteHorizontalPosition: 0,
      absoluteVerticalPosition:   0,
      topFromText:    0,
      bottomFromText: 0,
      leftFromText:   0,
      rightFromText:  0,
    },
    rows: [
      new TableRow({
        height: { value: pageHeightTwips, rule: 'exact' },
        children: [
          // Left — colour bar (25 % of physical page width)
          new TableCell({
            width:   { size: barWidthTwips, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: t.colorBarColor, color: 'auto' },
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
          }),
          // Right — title content with internal top padding and left gap
          new TableCell({
            width:   { size: restWidthTwips, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: {
              top:   convertInchesToTwip(t.marginTop),
              left:  convertInchesToTwip(0.3),
              right: convertInchesToTwip(t.marginRight),
            },
            children: content,
          }),
        ],
      }),
    ],
  });

  // Header: optional watermark only
  const headerChildren: Paragraph[] = [new Paragraph({ children: [] })];
  if (watermarkParagraph) headerChildren.push(watermarkParagraph);

  return {
    properties: {
      page: {
        size: pageSize,
        margin: {
          top:    convertInchesToTwip(t.marginTop),
          bottom: convertInchesToTwip(t.marginBottom),
          left:   Math.round(barWidthTwips + convertInchesToTwip(0.3)),
          right:  convertInchesToTwip(t.marginRight),
          header: 0,
          footer: 0,
        },
      },
    },
    headers: { default: new Header({ children: headerChildren }) },
    children: [titleTable],
  };
}

function changelogTable(changelog: ChangelogEntry[], template: DocxTemplate): (Paragraph | Table)[] {
  if (changelog.length === 0) return [];
  const borderColor = template.tableBorderColor;

  const headerRow = new TableRow({
    children: ['Version', 'Date', 'Author', 'Description'].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: template.tableHeaderTextColor })] })],
          shading: { type: ShadingType.CLEAR, fill: template.tableHeaderFill, color: 'auto' },
        })
    ),
    tableHeader: true,
  });

  const dataRows = changelog.map(
    (e) =>
      new TableRow({
        children: [
          e.version,
          new Date(e.date).toLocaleDateString(),
          e.author,
          e.description,
        ].map(
          (text) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text })] })],
            })
        ),
      })
  );

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Changelog' })],
    }),
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top:              { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        bottom:           { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        left:             { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        right:            { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: borderColor },
        insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: borderColor },
      },
    }),
  ];
}

function referencesList(references: Reference[]): Paragraph[] {
  if (references.length === 0) return [];
  const items: Paragraph[] = [
    // Force a page break so References always starts on its own page
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'References' })],
    }),
  ];
  references.forEach((ref, idx) => {
    let text = `[${idx + 1}] ${ref.authors}. "${ref.title}"`;
    if (ref.year) text += `, ${ref.year}`;
    if (ref.journal) text += `. ${ref.journal}`;
    if (ref.volume) text += `, ${ref.volume}`;
    if (ref.issue) text += `(${ref.issue})`;
    if (ref.pages) text += `:${ref.pages}`;
    if (ref.publisher) text += `. ${ref.publisher}`;
    if (ref.doi) text += `. DOI: ${ref.doi}`;
    if (ref.url) text += `. ${ref.url}`;
    items.push(
      new Paragraph({
        children: [new TextRun({ text })],
        spacing: { before: 120 },
      })
    );
  });
  return items;
}

function figureListSection(figureNumbers: Map<string, number>, flatNodes: SectionNode[]): Paragraph[] {
  const entries: { label: string; title: string; sectionNum: string }[] = [];

  function scan(node: SectionNode, content: JSONContent) {
    if (content.type === 'figureCaption') {
      const id = (content.attrs as { figureId?: string } | undefined)?.figureId ?? '';
      const num = figureNumbers.get(id);
      if (num !== undefined) {
        const title = extractTextFromContent(content.content ?? []);
        entries.push({ label: `Figure ${num}`, title, sectionNum: node.number });
      }
    }
    if (content.content) content.content.forEach((c) => scan(node, c));
  }

  for (const node of flatNodes) scan(node, node.section.content);
  if (entries.length === 0) return [];

  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'List of Figures' })] }),
    ...entries.map(
      (e) =>
        new Paragraph({
          children: [
            new TextRun({ text: `${e.label}: ${e.title}` }),
          ],
          spacing: { before: 80 },
        })
    ),
  ];
}

function tableListSection(tableNumbers: Map<string, number>, flatNodes: SectionNode[]): Paragraph[] {
  const entries: { label: string; title: string }[] = [];

  function scan(content: JSONContent) {
    if (content.type === 'tableCaption') {
      const id = (content.attrs as { captionId?: string } | undefined)?.captionId ?? '';
      const num = tableNumbers.get(id);
      if (num !== undefined) {
        const title = extractTextFromContent(content.content ?? []);
        entries.push({ label: `Table ${num}`, title });
      }
    }
    if (content.content) content.content.forEach(scan);
  }

  for (const node of flatNodes) scan(node.section.content);
  if (entries.length === 0) return [];

  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'List of Tables' })] }),
    ...entries.map(
      (e) =>
        new Paragraph({
          children: [new TextRun({ text: `${e.label}: ${e.title}` })],
          spacing: { before: 80 },
        })
    ),
  ];
}

// ─── Document styles from template ───────────────────────────────────────────

function buildDocumentStyles(t: DocxTemplate) {
  return {
    default: {
      document: {
        run: { font: t.bodyFont, size: t.bodyFontSize },
      },
      heading1: {
        run: { font: t.headingFont, size: t.h1Size, bold: true, color: t.headingColor },
      },
      heading2: {
        run: { font: t.headingFont, size: t.h2Size, bold: true, color: t.headingColor },
      },
      heading3: {
        run: { font: t.headingFont, size: t.h3Size, bold: true, color: t.subheadingColor },
      },
      heading4: {
        run: { font: t.headingFont, size: t.h4Size, bold: true, color: t.subheadingColor },
      },
    },
  };
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportToDocx(
  docMeta: ByteDocument,
  sections: Section[],
  changelog: ChangelogEntry[],
  references: Reference[],
  template?: DocxTemplate
): Promise<void> {
  const t: DocxTemplate = template ?? { ...DEFAULT_TEMPLATE, id: 'default' };

  const sectionTree = buildSectionTree(sections);
  const flatNodes = flattenTree(sectionTree);
  const { figureNumbers, tableNumbers } = buildCaptionMaps(flatNodes);

  // Page geometry
  const pageSize = PAGE_SIZES[t.pageSize];
  const pageMargins = {
    top:    convertInchesToTwip(t.marginTop),
    bottom: convertInchesToTwip(t.marginBottom),
    left:   convertInchesToTwip(t.marginLeft),
    right:  convertInchesToTwip(t.marginRight),
  };
  // When the color bar is enabled, set header margin to 0 so the bar paragraph
  // starts flush with the physical top edge of the page (not the header offset).
  const bodyMargins = t.colorBarEnabled
    ? { ...pageMargins, header: 0 }
    : pageMargins;
  const normalSectionProps = { page: { size: pageSize, margin: pageMargins } };
  const bodySectionProps   = { page: { size: pageSize, margin: bodyMargins } };

  // Build all body content — only root sections (depth 0) start on a new page
  const bodyChildren: (Paragraph | Table)[] = [];
  for (let i = 0; i < flatNodes.length; i++) {
    if (i > 0 && flatNodes[i].depth === 0) {
      bodyChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
    bodyChildren.push(...sectionToDocxChildren(flatNodes[i], figureNumbers, tableNumbers, t));
  }
  bodyChildren.push(...referencesList(references));

  const hasFigures = figureNumbers.size > 0;
  const hasTables  = tableNumbers.size > 0;

  // Header / footer
  // Color bar paragraph (bleeds to physical left/right edges via negative indent)
  const headerBarParagraph = t.colorBarEnabled
    ? new Paragraph({
        indent: {
          left:  -convertInchesToTwip(t.marginLeft),
          right: -convertInchesToTwip(t.marginRight),
        },
        shading: { type: ShadingType.CLEAR, fill: t.colorBarColor, color: 'auto' },
        spacing: { before: 0, after: 0, line: convertInchesToTwip(0.225), lineRule: LineRuleType.EXACT },
        children: [],
      })
    : null;

  // Each header that needs the watermark gets its own fresh instance — sharing a
  // single XmlComponent across multiple Header objects causes only the first to
  // serialise it (the library tracks object references internally).
  const makeWatermark = () =>
    buildWatermarkParagraph(docMeta.status, t.watermarkOpacity ?? 20);
  const wmEnabled = t.watermarkEnabled ?? false;

  // Body header: color bar + spacer + optional watermark
  const bodyHeaderChildren: Paragraph[] = [
    ...(headerBarParagraph ? [headerBarParagraph] : []),
    new Paragraph({ children: [] }),
    ...(wmEnabled ? [makeWatermark()] : []),
  ];
  const header = new Header({ children: bodyHeaderChildren });

  // Watermark-only header (for frontmatter sections without a color bar)
  const watermarkOnlyHeader = wmEnabled
    ? new Header({ children: [new Paragraph({ children: [] }), makeWatermark()] })
    : null;

  // Convenience alias for the title page section builder
  const watermarkParagraph = wmEnabled ? makeWatermark() : null;

  const footerChildren = t.showFooter
    ? [new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          // Left: title · version
          new TextRun({ text: docMeta.title, color: '888888', size: 18, font: t.bodyFont }),
          new TextRun({ text: '  ·  ', color: '555555', size: 18 }),
          new TextRun({ text: `v${docMeta.version}`, color: '888888', size: 18, font: t.bodyFont }),
          // Right: page / total (tab pushes to the right edge)
          new TextRun({ text: '\t', size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888' }),
          new TextRun({ text: ' / ', size: 18, color: '555555' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '888888' }),
        ],
      })]
    : [new Paragraph({ children: [] })];

  const footer = new Footer({ children: footerChildren });

  // Front-matter children
  // Title page is excluded here when colorBarEnabled — it goes in its own zero-margin section.
  const frontmatterChildren: (Paragraph | Table)[] = [];

  const pushFrontmatter = (...items: (Paragraph | Table)[]) => {
    if (frontmatterChildren.length > 0) {
      frontmatterChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
    frontmatterChildren.push(...items);
  };

  if (t.includeTitlePage && !t.colorBarEnabled) {
    frontmatterChildren.push(...titlePageChildren(docMeta, t));
  }

  if (t.includeToc) {
    pushFrontmatter(
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Table of Contents' })], spacing: { after: 240 } }),
      new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-6' }),
    );
  }

  if (t.includeChangelog && changelog.length > 0) {
    pushFrontmatter(...changelogTable(changelog, t));
  }

  if (t.includeListOfFigures && hasFigures) {
    pushFrontmatter(...figureListSection(figureNumbers, flatNodes));
  }

  if (t.includeListOfTables && hasTables) {
    pushFrontmatter(...tableListSection(tableNumbers, flatNodes));
  }

  // ── Assemble DOCX sections ──────────────────────────────────────────────────
  // When color bar is enabled:
  //   1. Title page section — zero page margins, full-height bar table
  //   2. Remaining frontmatter section (TOC / changelog / etc.)
  //   3. Body section — header margin = 0 so bar flush with physical top edge
  // When color bar is disabled:
  //   1. Frontmatter section (includes title page)
  //   2. Body section

  const docSections: ISectionOptions[] = [];

  if (t.includeTitlePage && t.colorBarEnabled) {
    docSections.push(
      buildColorBarTitlePageSection(docMeta, t, pageSize, watermarkParagraph) as ISectionOptions,
    );
  }

  if (frontmatterChildren.length > 0) {
    docSections.push({
      properties: normalSectionProps,
      ...(watermarkOnlyHeader ? { headers: { default: watermarkOnlyHeader } } : {}),
      children: frontmatterChildren,
    });
  }

  docSections.push({
    properties: bodySectionProps,
    headers: { default: header },
    footers: { default: footer },
    children: bodyChildren,
  });

  const doc = new Document({
    styles: buildDocumentStyles(t),
    numbering: {
      config: [
        {
          reference: 'ordered-list',
          levels: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((level) => ({
            level,
            format: 'decimal' as const,
            text: `%${level + 1}.`,
            alignment: AlignmentType.LEFT,
          })),
        },
      ],
    },
    sections: docSections,
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${docMeta.title.toLowerCase().replace(/\s+/g, '-')}-v${docMeta.version}.docx`;
  saveAs(blob, filename);
}
