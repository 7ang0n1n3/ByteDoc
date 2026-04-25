# Changelog

All notable changes to ByteDoc are documented here.

---

## [0.0.11] — 2026-04-26

### Fixed

- DOCX export now preserves selected text colours and custom highlight colours instead of forcing highlights to yellow
- Colour-only text no longer gains underline formatting during DOCX export
- Custom colour picker hue dragging now updates the preview consistently and avoids hue wraparound at the slider edge

### Changed

- Reduced the custom colour picker size and made the saturation/brightness area render as a true gradient

---

## [0.0.10] — 2026-04-26

### Changed

- Reworked text colour and highlight dropdowns into menu-style palettes with automatic/reset actions, standard colour rows, recent colours, and custom colour picking
- Fixed palette swatch layout so colour buttons keep stable spacing and do not overlap

---

## [0.0.9] — 2026-04-26

### Changed

- Reused the document transfer controls across the toolbar and the empty welcome state
- Kept JSON import visible and usable when there are no documents yet
- Kept JSON and DOCX export actions visible in the empty state, disabled until a document is active

---

## [0.0.8] — 2026-04-25

### Changed

- Redesigned the editor toolbar into a two-level layout with application menus above grouped formatting controls
- Moved Save and Export actions into the toolbar and removed duplicate header buttons from the document chrome
- Added dropdowns for style, text colour, highlight colour, alignment, lists, and table-grid insertion
- Restyled the toolbar to match ByteDoc's dark-first surface palette while preserving light-mode overrides

---

## [0.0.7] — 2026-04-25

### Added

- Single Insert Table dialog for choosing row count, column count, and whether the first row is a header
- Contextual table toolbar controls for adding/deleting rows and columns, deleting tables, and toggling header rows, columns, or cells
- Table cell styling controls for background colour, foreground/text colour, line type, and clearing cell styles
- DOCX export support for table cell colours and line styles

### Changed

- New tables no longer force the first row to be a header by default

---

## [0.0.6] — 2026-04-25

### Added

- Font-size selector in the editor toolbar for inline text sizing
- Increase and decrease indent controls for paragraphs and headings
- DOCX export support for editor-applied font sizes and paragraph/heading indentation

---

## [0.0.5] — 2026-04-18

### Changed

- Added the ByteDoc logo to the sidebar header and README

---

## [0.0.3] — 2026-04-05

### Added

- One blank line (12 pt spacing) after every section heading (H1–H6) on export
- One blank line after the Table of Contents heading on export

### Fixed

- Blank page between title page and the following page — trailing `PageBreak` paragraphs at the end of front-matter blocks combined with DOCX section boundaries to produce an extra blank page; switched to a leading-break pattern so no block ends with a trailing page break
- Each section now starts on a new page on export

---

## [0.0.2] — 2026-04-05

### Changed

- Default host port changed from `3000` to `3019` (`docker-compose.yml`, `start-docker.sh`, `.env.example`)

### Fixed

- TypeScript build error in `src/lib/export.ts` — `Parameters<typeof Document>` resolved to the global DOM `Document` type instead of the `docx` library class; replaced with `ISectionOptions` imported directly from `docx`

---

## [0.0.1] — 2026-04-05

Initial release.

### Added

#### Core editor
- TipTap-based rich text editor with full inline formatting (bold, italic, underline, strikethrough, subscript, superscript, text colour, highlight, links)
- Block-level elements: headings H1–H4, paragraphs, bullet lists, ordered lists, blockquotes, code blocks (syntax-highlighted via lowlight/highlight.js), horizontal rules, images
- Table support with header row detection
- Page break node — inserts a hard page break in the editor and exports as a real DOCX `<w:br type="page"/>` element
- Custom extensions: Citation, Footnote, FigureCaption, TableCaption, PageBreak
- Live character count in editor footer

#### Document management
- Multi-document support with a sidebar document list
- Nested section tree with drag-and-drop reordering (dnd-kit)
- Auto-numbering of section headings (`1`, `1.1`, `1.1.2`, …)
- Document metadata: title, subtitle, author, organisation, version, status (Draft / Review / Final), description/abstract
- Per-document changelog with version, date, author, and description fields
- Per-document reference list with full bibliographic fields (authors, title, year, journal, volume, issue, pages, publisher, DOI, URL)

#### Storage
- Offline-first IndexedDB storage via Dexie 4
- Schema v1: documents, sections, references, footnotes, changelog
- Schema v2: added templates table with auto-migration

#### DOCX export
- Full DOCX generation via the `docx` library
- Template system — create, duplicate, rename, and delete named export templates
- Per-template settings:
  - Body and heading font families
  - Font sizes for body, H1, H2, H3, H4 (stored as half-points)
  - Heading colour (H1/H2), subheading colour (H3/H4), accent colour (links, citations), table header fill, table header text colour, table border colour
  - Page size (A4 / Letter)
  - Page margins (top, bottom, left, right) in inches
  - Header and footer visibility toggles
  - Front-matter toggles: title page, table of contents, changelog, list of figures, list of tables
  - Color bar option — horizontal bar across the top of body pages; on the title page a full-height vertical bar on the left occupying 25 % of the page width, anchored flush to the physical page corner via a floating table (`w:tblpPr`) so no margin gap occurs at the top or bottom
  - Title page logo — upload an image, choose position (upper-left, upper-right, above title)
  - Watermark — document status stamped diagonally (−45°) across every page at 64 pt using a drawingML `wp:anchor` text box in the header; visibility 1–100
- Active template selector — one template is the active export target
- Export modal with template picker and direct link to template manager
- Footer layout: title · version left-aligned, page `n / total` right-aligned via a `TabStopType.RIGHT` tab stop at `TabStopPosition.MAX`
- References section always starts on its own page (leading page break)
- Body section `header: 0` margin so the color bar header paragraph bleeds flush to the physical top edge of the page
- Filename pattern: `<title>-v<version>.docx`

#### Interface
- Dark / light mode toggle (Sun/Moon button, top-right corner)
- Theme persisted to `localStorage`; applied before first render via an inline `<script>` to prevent flash
- Light mode uses near-white/white surfaces for maximum brightness
- Modal system: Document Settings, Export, Template Settings, Reference editor
- Template Settings modal: full two-panel editor (template list + form) with save, duplicate, delete, and "use for export" actions

#### Docker
- Multi-stage `Dockerfile` — Node 20 Alpine build stage, nginx stable-alpine serve stage
- `docker-compose.yml` — single `app` service, host port configurable via `PORT` env var (default `3019`)
- `nginx.conf` — SPA history-API fallback (`try_files … /index.html`), gzip enabled, long-lived cache headers for hashed assets, no-cache on `index.html`
- `start-docker.sh` — TraceLab-style CLI: `start [--build] [--logs]` and `stop` commands with coloured output and readiness polling
- `Makefile` — `up`, `down`, `build`, `logs`, `ps`, `restart`, `clean`, `dev`, `install` targets
- `.env.example` — documents the `PORT` variable
- `.dockerignore` — excludes `node_modules/`, `dist/`, `.env`, logs, editor directories, OS files

---

## [0.0.4] — 2026-04-13

### Added

- Double-click a document name in the sidebar to open its settings modal directly — works for both active and inactive documents
