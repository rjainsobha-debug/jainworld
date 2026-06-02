# Digital Panchang Workflow

This workflow keeps the JainWorld Panchang experience source-first and review-first.

## 1. Start with the source

- Use the scanned 2026 Panchang pages as reference material.
- Preserve visible credits, publisher names, and source branding.
- Do not guess dates from the scan.

## 2. Build the skeleton

```powershell
node .\tools\bots\build-panchang-digital-skeleton.js
```

This creates the 365-day digital shell, manual extraction queue, and OCR review queue.

## 3. Review manually

- Open the month image or back-page PDF.
- Extract only the observances that are clearly readable.
- Keep uncertain items in `needs_review`.
- Do not publish exact observance dates until a human reviewer confirms them.

## 4. Optional OCR assist

```powershell
node .\tools\bots\panchang-ocr-assist.js
```

Use OCR only if a local OCR engine is available.
OCR output stays review-only.

## 5. Apply reviewed manual extraction

```powershell
node .\tools\bots\apply-panchang-manual-extraction.js
```

Only apply records that are already reviewed.

## 6. Review the result

```powershell
node .\tools\bots\calendar-review-preview.js
```

## 7. Keep local verification visible

- Dates may vary by panchang, location, tradition, and local sangh.
- Important observances should still be verified locally.

