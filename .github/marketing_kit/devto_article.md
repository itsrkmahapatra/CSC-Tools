# Building Docuvate: An Offline-First WASM-Powered Document Utility Suite

## The Problem
We all need to manipulate PDFs and images—whether it is merging documents, compressing large files, or extracting text via OCR. However, using online SaaS utilities usually means uploading highly sensitive documents to third-party servers. 

I wanted an all-in-one document suite that is:
1. **WASM-Accelerated:** Capable of running heavy PDF modifications and compression locally.
2. **Offline-First:** Processes documents entirely in-browser using WebAssembly and client-side libraries.
3. **Feature-Rich:** Includes signature pads, metadata sanitizers, image converters, and OCR.

So, we built **Docuvate**.

## Architecture & Code Breakdown
Docuvate is built on React, Next.js, WebAssembly, and TailwindCSS.

By leveraging **PDF-Lib** and WASM, we perform all PDF modifications locally. Here is how we remove metadata from a PDF file to sanitize it before sharing:

```typescript
import { PDFDocument } from 'pdf-lib';

async function sanitizePDF(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  // Clear sensitive metadata fields
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setCreator('');
  pdfDoc.setProducer('');
  
  return await pdfDoc.save();
}
```

For OCR, we run **Tesseract.js** directly inside a Web Worker. This prevents blocking the main UI thread during intensive OCR scans:

```typescript
import { createWorker } from 'tesseract.js';

async function performOCR(imageFile: File, onProgress: (p: number) => void) {
  const worker = await createWorker();
  
  // Initialize worker for English language
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  
  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();
  return text;
}
```

## Lessons Learned
1. **Web Workers are Essential:** OCR and PDF processing are computationally expensive. Running them in Web Workers is critical to maintaining a responsive, lag-free user interface.
2. **Next.js SSR vs Client-Side WASM:** Since Next.js uses server-side rendering by default, we had to dynamically load our WASM-dependent modules with `ssr: false` to avoid build errors.

## Check It Out!
Docuvate is completely open-source, free, and hosts 35+ browser utilities.
👉 [https://github.com/itsrkmahapatra/Docuvate](https://github.com/itsrkmahapatra/Docuvate)