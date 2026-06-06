# ✍️ Docuvate

A secure, offline-first WebAssembly-powered document utility suite to merge, sign, compress, and process PDFs and images directly in your browser.

---

[![Build Status](https://img.shields.io/github/actions/workflow/status/itsrkmahapatra/Docuvate/ci.yml?branch=main)](https://github.com/itsrkmahapatra/Docuvate/actions)
[![License](https://img.shields.io/github/license/itsrkmahapatra/Docuvate)](https://github.com/itsrkmahapatra/Docuvate/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/itsrkmahapatra/Docuvate/pulls)
[![Maintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/itsrkmahapatra/Docuvate/graphs/commit-activity)

---

## 🎨 Product Demo Visual
Check out our interactive demo in action:

![Product Demo Visual](./assets/demo.gif)

---

## ✨ Key Features
- ⚡ **WASM Acceleration**: High-performance client-side document processing (PDF parsing, file compression).
- 👁️ **Offline OCR Engine**: Powered by Tesseract.js to scan text from images securely on your device.
- 🖊️ **Signature Pad**: Easily sign, export, and embed signatures directly onto your PDF documents.
- 🛠️ **35+ Web Utilities**: Seamless merging, metadata removal, and image conversion tools.
- 🔒 **Complete Privacy**: Zero cloud uploads; your sensitive files never leave your system.

---

## 🚀 Quick Start
Clone the repository, install the dependencies, and start the development server using npm.

---

## 💡 Usage Example
Here is how to get started programmatically:

```typescript
// Example using PDFDocument to load and inspect metadata locally
import { PDFDocument } from 'pdf-lib';

async function sanitizePDF(pdfBytes: Uint8Array) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  return await pdfDoc.save();
}
```

---

## 🛠️ Technology Stack
- **Core Technologies:** TypeScript, React, Next.js, WebAssembly (WASM), Tesseract.js (OCR), PDF-Lib, TailwindCSS
- **Environment Support:** Cross-platform web browsers & local instances where applicable.

---

## 🤝 Contributing
Contributions are extremely welcome! Please check out [CONTRIBUTING.md](.github/CONTRIBUTING.md) for local setup and guidelines.

---

## 📜 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 📥 Download Application
- [🖥️ Windows Download (.exe)](https://github.com/itsrkmahapatra/Docuvate/releases/latest
- [📱 Android Download (.apk)](https://github.com/itsrkmahapatra/Docuvate/releases/latest
