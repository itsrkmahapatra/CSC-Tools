# Docuvate Update Plan

This document tracks the audit findings and planned improvements for Docuvate.

## Phase 1: Audit Findings

### Core Issues
- **Rendering**: HTML to PDF/Image fails to load external CSS/JS/Fonts correctly.
- **Photo Editor**: Mouse misalignment on canvas; extremely limited toolset (only freehand drawing).
- **PDF Tools**: Many lack page-level controls (rotate, delete, reorder).
- **UI/UX**: Consistency issues; some tools use `red` theme, others `blue` or `indigo` without a clear pattern.
- **Performance**: Heavy dependencies (Tesseract, ONNX) could benefit from better lazy loading.

## Phase 2: Tool Improvement Checklist

### PDF Tools
- [x] **JPG to PDF**
    - [x] Add page settings: A4/Letter/Legal/Custom.
    - [x] Orientation: Portrait/Landscape.
    - [x] Margins: None/Small/Big.
    - [x] Image Scaling: Fit/Fill/Stretch.
    - [x] Layout preview.
    - [x] Persist settings via localStorage.
- [x] **Merge PDF**
    - [x] Add drag-drop page reordering (using `@hello-pangea/dnd`).
    - [x] Add rotate/delete per page/file.
    - [x] Show size estimate of merged file.
- [x] **PDF Compare**
    - [x] Support multiple pages (navigation).
    - [x] Show similarity % between docs.
    - [x] Highlight visual diffs more clearly (toggleable overlays).
    - [x] Summary: % match, changed pages count.
- [x] **Add Watermark (PDF)**
    - [x] Add font picker.
    - [x] Opacity, rotation, and tiling controls.
    - [x] Position presets (Center, Top-Left, etc.).
    - [x] Live preview on a sample page.
- [ ] **Organize PDF** (Improving existing)
    - [ ] Ensure smooth drag-drop.
    - [ ] Add "Insert Blank Page".

### Image Tools
- [x] **Compress Image**
    - [x] Add "Target File Size" mode (KB/MB).
    - [x] Auto-tune quality/dimensions to hit target.
    - [x] Show before/after stats (Size, Dim).
- [x] **OCR PDF** (Renaming to OCR Image/PDF)
    - [x] Add "Copy" button per page + "Copy All".
    - [x] Toast notification on copy.
    - [x] Preserve line breaks correctly.
    - [x] Support PDF input (rasterize pages first).
- [x] **Exam Photo Resizer**
    - [x] Add Indian exam presets: SSC, UPSC, NEET, JEE.
    - [x] Custom dimension + file size + DPI limits.
    - [x] Auto background to white (using canvas/AI).
    - [x] Face centering detection (using simple heuristic or TF.js).
- [x] **Photo Editor**
    - [x] Fix canvas mouse misalignment (align with image aspect ratio).
    - [x] Add Crop (with common ratios).
    - [x] Add Rotate/Flip.
    - [x] Add Filters: Brightness, Contrast, Saturation, Blur.
    - [x] Add Text & Stickers.
    - [x] Add Undo/Redo.
    - [x] Export formats: PNG, JPG, WebP.

### Conversion Tools
- [x] **HTML to PDF / HTML to Image**
    - [x] Fix CSS/JS loading for live render.
    - [x] Add "Wait for network idle" logic.
    - [x] Support Print CSS media.
    - [x] Add Viewport & Scale options.

## Phase 3: Implementation Strategy
1. **Critical Fixes**: Canvas alignment in Photo Editor and rendering in HTML tools.
2. **Shared Utils**: Refactor `pdf-utils.ts` to include common page operations.
3. **Incremental Tool Updates**: Follow the checklist above.
4. **Validation**: Test each tool locally before moving to the next.

## Phase 4: Deployment
1. Update `README.md`.
2. Push to `main` for GH Pages deploy.
